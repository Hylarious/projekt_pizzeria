import { select, classNames, templates } from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Product {
  constructor(id, data) {
    const thisProduct = this;
    thisProduct.id = id;
    thisProduct.data = data;
    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();
  }

  renderInMenu() {
    const thisProduct = this;
    /*[DONE]generate html based on template */
    const generatedHTML = templates.menuProduct(thisProduct.data);
    /* [DONE]create element using utils.createElementFromHtml*/
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
  initAccordion() {
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
    /*set price to default price */
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
    // multiply price by amount
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
    const preparedProduct = thisProduct.prepareCartProduct();
    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: preparedProduct,
      },
    });

    thisProduct.element.dispatchEvent(event);
  }
}
export default Product;
