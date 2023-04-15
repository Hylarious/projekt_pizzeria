import { select, templates } from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Booking {
  constructor(element) {
    const thisBooking = this;
    thisBooking.render(element);
    thisBooking.initWidgets();
  }
  render(booking) {
    const thisBooking = this;

    thisBooking.dom = {};
    thisBooking.dom.wrapper = booking;

    const generatedHTML = templates.bookingWidget();
    const generatedDom = utils.createDOMFromHTML(generatedHTML);
    thisBooking.dom.wrapper.appendChild(generatedDom);
    thisBooking.dom.peopleAmount = document.querySelector(
      select.booking.peopleAmount
    );

    thisBooking.dom.hoursAmount = document.querySelector(
      select.booking.hoursAmount
    );
  }
  initWidgets() {
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
  }
}
export default Booking;
