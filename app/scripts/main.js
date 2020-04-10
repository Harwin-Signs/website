import ScrollReveal from 'scrollreveal';
import 'validate-js';
import emailjs from 'emailjs-com';

(() => {
  const DOM = {
    splash: document.querySelector('#splash'),
    form: document.querySelector('#form')
  };

  const updateViewportHeight = () => {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };


  window.addEventListener('resize', updateViewportHeight);
  updateViewportHeight();

  // Animations
  ScrollReveal().reveal('section [data-animate], footer [data-animate]', { distance: '30px', origin: 'bottom', delay: 0.3, interval: 30, easing: 'ease-in-out' });

  // https://rickharrison.github.io/validate.js/
  new FormValidator(DOM.form, [
      {
        name: 'name',
        display: 'Please tell us your name',
        rules: 'required'
      },
      {
        name: 'email',
        display: 'Please enter a valid email address',
        rules: 'required|valid_email'
      },
      {
        name: 'details',
        display: 'Please tell us a little bit about your project so that we\'re better able to give you an estimate',
        rules: 'required'
      }
    ],
    (errors, event) => {
      event.preventDefault();

      // Clear Errors
      [...DOM.form.querySelectorAll('.error')].map(node => node.classList.remove('error'));
      [...DOM.form.querySelectorAll('.error-message')].map(node => node.remove());
      
      if (errors.length) {
        errors.map(({ element, display }) => {
          const label = DOM.form.querySelector(`label[for='${element.id}']`);
          label && label.classList.add('error');
          element.classList.add('error');
          element.insertAdjacentHTML('afterend', `<span class="error-message">${display}</span>`);
        });
      } else {
        emailjs.init('user_OjIj4Kd41wsMzSVIzcAZZ');
        emailjs.sendForm('default_service', 'harwin_signs_contact_form', DOM.form)
          .then(resp => {
            DOM.form.classList.add('thanks');
            DOM.form.reset();
            ScrollReveal().sync();
            console.log(resp);
          }, err => {
            console.log(err);
          });
      }
    }
  );

  document.querySelector('.js--back-to-form').addEventListener('click', e => {
    e.preventDefault();
    DOM.form.classList.remove('thanks');
  });

  // Preloader
  Pace.once('done', () => DOM.splash.classList.add('start-animations'));
})();