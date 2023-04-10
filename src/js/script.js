/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  ('use strict');

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },

    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice:
        '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },

    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 0,
      defaultMax: 10,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(
      document.querySelector(select.templateOf.menuProduct).innerHTML
    ),
    cartProduct: Handlebars.compile(
      document.querySelector(select.templateOf.cartProduct).innerHTML
    ),
  };

  class Product {
    constructor(id, data) {
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data;
      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAcordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
    }

    renderInMenu() {
      const thisProduct = this;
      /*[DONE]generate html based on template */
      const generatedHTML = templates.menuProduct(thisProduct.data);
      /* [DONE]create eleemnt using utils.createElementFromHtml*/
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      /*[DONE]find menu container */
      const menuContainer = document.querySelector(select.containerOf.menu);
      /*[DONE]add element to menu */
      menuContainer.appendChild(thisProduct.element);
    }

    getElements() {
      const thisProduct = this;

      thisProduct.accordionTrigger = thisProduct.element.querySelector(
        select.menuProduct.clickable
      );
      thisProduct.form = thisProduct.element.querySelector(
        select.menuProduct.form
      );
      thisProduct.formInputs = thisProduct.form.querySelectorAll(
        select.all.formInputs
      );
      thisProduct.cartButton = thisProduct.element.querySelector(
        select.menuProduct.cartButton
      );
      thisProduct.priceElem = thisProduct.element.querySelector(
        select.menuProduct.priceElem
      );
      thisProduct.imageWrapper = thisProduct.element.querySelector(
        select.menuProduct.imageWrapper
      );
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(
        select.menuProduct.amountWidget
      );
    }
    initAmountWidget() {
      const thisProduct = this;

      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function () {
        thisProduct.processOrder();
      });
    }
    initAcordion() {
      const thisProduct = this;

      /*[DONE] START: add event listener to clickable trigger on event click */
      thisProduct.accordionTrigger.addEventListener('click', function (event) {
        /* [DONE]prevent default action for event */
        event.preventDefault();
        /* [DONE]find active product (product that has active class) */
        const activeProduct = document.querySelector(
          select.all.menuProductsActive
        );

        /* [DONE]if there is active product and it's not thisProduct.element, remove class active from it */
        if (activeProduct && activeProduct != thisProduct.element) {
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }
        /* [DONE]toggle active class on thisProduct.element */
        thisProduct.element.classList.toggle(
          classNames.menuProduct.wrapperActive
        );
      });
    }
    initOrderForm() {
      const thisProduct = this;
      thisProduct.form.addEventListener('submit', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
      });

      for (let input of thisProduct.formInputs) {
        input.addEventListener('change', function () {
          thisProduct.processOrder();
        });
      }

      thisProduct.cartButton.addEventListener('click', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }
    processOrder() {
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form);
      /*set proce to default proce */
      let price = thisProduct.data.price;

      /*for every category(param)...  */
      for (let paramId in thisProduct.data.params) {
        /*determinate param value */
        const param = thisProduct.data.params[paramId];

        /*for every option in this category */
        for (let optionId in param.options) {
          /* determine option value*/
          const option = param.options[optionId];

          if (formData[paramId] && formData[paramId].includes(optionId)) {
            if (!option.default) {
              price += option.price;
            }
          } else {
            if (option.default) price -= option.price;
          }

          const productImg = thisProduct.imageWrapper.querySelector(
            'img.' + paramId + '-' + optionId
          );

          if (productImg) {
            productImg.classList.remove(classNames.menuProduct.imageVisible);
            if (formData[paramId] && formData[paramId].includes(optionId)) {
              productImg.classList.add(classNames.menuProduct.imageVisible);
            }
          }
        }
      }
      thisProduct.priceSingle = price;
      // multipy proce by amount
      price *= thisProduct.amountWidget.value;
      /*update calculated price in the HTML*/
      thisProduct.priceElem.innerHTML = price;
    }
    prepareCartProduct() {
      const thisProduct = this;
      const productSummary = {};

      productSummary.id = thisProduct.id;
      productSummary.name = thisProduct.data.name;
      productSummary.amount = thisProduct.amountWidget.value;
      productSummary.priceSingle = thisProduct.priceSingle;
      productSummary.price =
        thisProduct.priceSingle * thisProduct.amountWidget.value;
      productSummary.params = thisProduct.prepareCartProductParams();
      return productSummary;
    }
    prepareCartProductParams() {
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form);

      const productParams = {};

      /*for every category(param)...  */
      for (let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];
        productParams[paramId] = {
          label: param.label,
          options: {},
        };
        /*for every option in this category */
        for (let optionId in param.options) {
          const option = param.options[optionId];
          if (formData[paramId] && formData[paramId].includes(optionId)) {
            productParams[paramId].options[optionId] = option.label;
          }
        }
      }
      return productParams;
    }
    addToCart() {
      const thisProduct = this;

      app.cart.add(thisProduct.prepareCartProduct());
    }
  }

  class AmountWidget {
    constructor(element) {
      const thisWidget = this;

      thisWidget.getElements(element);
      thisWidget.setValue(
        thisWidget.input.value || settings.amountWidget.defaultValue
      );
      thisWidget.initAction();
    }

    getElements(element) {
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(
        select.widgets.amount.input
      );
      thisWidget.linkDecrease = thisWidget.element.querySelector(
        select.widgets.amount.linkDecrease
      );
      thisWidget.linkIncrease = thisWidget.element.querySelector(
        select.widgets.amount.linkIncrease
      );
    }

    setValue(value) {
      const thisWidget = this;
      const newValue = parseInt(value);

      if (
        !isNaN(newValue) &&
        newValue !== thisWidget.value &&
        newValue >= settings.amountWidget.defaultMin &&
        newValue <= settings.amountWidget.defaultMax
      ) {
        thisWidget.value = newValue;
        thisWidget.announce();
      }
      thisWidget.input.value = thisWidget.value;
    }

    initAction() {
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function () {
        thisWidget.setValue(thisWidget.input.value);
      });

      thisWidget.linkDecrease.addEventListener('click', function (event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });

      thisWidget.linkIncrease.addEventListener('click', function (event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });
    }

    announce() {
      const thisWidget = this;

      const event = new CustomEvent('updated', {
        bubbles: true,
      });
      thisWidget.element.dispatchEvent(event);
    }
  }

  class Cart {
    constructor(element) {
      const thisCart = this;

      thisCart.products = [];

      thisCart.getElements(element);
      thisCart.initActions();
    }

    getElements(element) {
      const thisCart = this;

      thisCart.dom = {};

      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(
        select.cart.toggleTrigger
      );
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(
        select.cart.productList
      );
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(
        select.cart.deliveryFee
      );
      thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(
        select.cart.subtotalPrice
      );
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(
        select.cart.totalPrice
      );
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(
        select.cart.totalNumber
      );
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      thisCart.dom.address = thisCart.dom.wrapper.querySelector(
        select.cart.address
      );
      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(
        select.cart.phone
      );
    }

    initActions() {
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function () {
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
      thisCart.dom.productList.addEventListener('updated', function () {
        thisCart.update();
      });
      thisCart.dom.productList.addEventListener('remove', function (event) {
        thisCart.remove(event.detail.cartProduct);
      });
      thisCart.dom.form.addEventListener('submit', function (event) {
        event.preventDefault();
        thisCart.sendOrder();
      });
    }

    add(menuProduct) {
      const thisCart = this;

      const generatedHTML = templates.cartProduct(menuProduct);
      const genetaredDom = utils.createDOMFromHTML(generatedHTML);
      thisCart.dom.productList.appendChild(genetaredDom);
      thisCart.products.push(new CartProduct(menuProduct, genetaredDom));
      thisCart.update();
    }

    update() {
      const thisCart = this;
      const deliveryFee = settings.cart.defaultDeliveryFee;
      thisCart.totalPrice = 0;
      thisCart.totalNumber = 0;
      thisCart.subtotalPrice = 0;
      thisCart.dom.deliveryFee.innerHTML = deliveryFee;
      for (let product of thisCart.products) {
        thisCart.totalNumber += product.amount;
        thisCart.subtotalPrice += product.price;
      }
      if (thisCart.totalNumber != 0) {
        thisCart.totalPrice = thisCart.subtotalPrice + deliveryFee;
        thisCart.dom.deliveryFee.innerHTML = deliveryFee;
      }

      thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;

      for (let price of thisCart.dom.totalPrice) {
        price.innerHTML = thisCart.totalPrice;
      }
    }
    remove(removedItem) {
      const thisCart = this;

      removedItem.dom.wrapper.remove();
      const indexOfRemovedItem = thisCart.products.indexOf(removedItem);
      thisCart.products.splice(indexOfRemovedItem, 1);

      thisCart.update();
    }
    sendOrder() {
      const thisCart = this;

      const url = settings.db.url + '/' + settings.db.orders;

      let payload = {};
      payload.address = thisCart.dom.address.value;
      payload.phone = thisCart.dom.phone.value;
      payload.totalPrice = thisCart.totalPrice;
      payload.subtotalPrice = thisCart.subtotalPrice;
      payload.totalNumber = thisCart.totalNumber;
      payload.deliveryFee = settings.cart.defaultDeliveryFee;

      payload.products = [];
      for (let prod of thisCart.products) {
        payload.products.push(prod.getData());
      }

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };

      // fetch(url, options);

      fetch(url, options)
        .then(function (response) {
          return response.json();
        })
        .then(function (parsedResponse) {
          console.log('parsedResponse', parsedResponse);
        });
    }
  }

  class CartProduct {
    constructor(menuProduct, element) {
      const thisCartProduct = this;

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.params = menuProduct.params;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.priceSingle = menuProduct.priceSingle;

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initAction();
    }
    getElements(element) {
      const thisCartProduct = this;

      thisCartProduct.dom = {};
      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = element.querySelector(
        select.cartProduct.amountWidget
      );
      thisCartProduct.dom.price = element.querySelector(
        select.cartProduct.price
      );
      thisCartProduct.dom.edit = element.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = element.querySelector(
        select.cartProduct.remove
      );
    }
    getData() {
      const thisCartProduct = this;

      let orderedProduct = {};
      orderedProduct.id = thisCartProduct.id;
      orderedProduct.amount = thisCartProduct.amount;
      orderedProduct.price = thisCartProduct.price;
      orderedProduct.priceSingle = thisCartProduct.priceSingle;
      orderedProduct.name = thisCartProduct.name;
      orderedProduct.params = thisCartProduct.params;

      return orderedProduct;
    }
    initAmountWidget() {
      const thisCartProduct = this;

      thisCartProduct.amountWidget = new AmountWidget(
        thisCartProduct.dom.amountWidget
      );

      thisCartProduct.dom.price.innerHTML = thisCartProduct.priceSingle;
      thisCartProduct.dom.amountWidget.addEventListener('updated', function () {
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price =
          thisCartProduct.priceSingle * thisCartProduct.amount;
      });
    }
    initAction() {
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener('click', function (event) {
        event.preventDefault();
      });
      thisCartProduct.dom.remove.addEventListener('click', function (event) {
        event.preventDefault();
        thisCartProduct.remove();
      });
    }
    remove() {
      const thisCartProduct = this;

      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });
      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }
  }

  const app = {
    initMenu: function () {
      const thisApp = this;
      console.log('thisApp.data: ', thisApp.data);

      for (let productData in thisApp.data.products) {
        new Product(
          thisApp.data.products[productData].id,
          thisApp.data.products[productData]
        );
      }
    },
    initCart: function () {
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },

    initData: function () {
      const thisApp = this;

      thisApp.data = {};

      const url = settings.db.url + '/' + settings.db.products;

      fetch(url)
        .then(function (rawResponse) {
          return rawResponse.json();
        })
        .then(function (parsedResponse) {
          console.log('parsedResponse', parsedResponse);
          thisApp.data.products = parsedResponse;
          thisApp.initMenu();
        });

      console.log('thisApp.data', JSON.stringify(thisApp.data));
    },

    init: function () {
      const thisApp = this;
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);
      console.log('thisCart: ', cart);

      thisApp.initData();

      thisApp.initCart();
    },
  };

  app.init();
}
