import { select } from '../settings.js';
import AmountWidget from './AmountWidget.js';

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
    thisCartProduct.dom.price = element.querySelector(select.cartProduct.price);
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

export default CartProduct;
