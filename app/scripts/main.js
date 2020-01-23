import 'validate-js';
import emailjs from 'emailjs-com';

(() => {
  const DOM = {
    form: document.querySelector('#form')
  };

  const updateViewportHeight = () => {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };


  window.addEventListener('resize', updateViewportHeight);
  updateViewportHeight();

  const getFormValues = form => {
    const fields = form.querySelectorAll('[name]');
    const data = [...fields].reduce((accum, curr) => {
      let obj = {};
      obj[curr.name] = curr.value;
      return {...accum, ...obj};
    }, {});
    return data;
  };

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
          element.classList.add('error');
          element.insertAdjacentHTML('afterend', `<span class="error-message">${display}</span>`);
        });
      } else {
        emailjs.init('user_OjIj4Kd41wsMzSVIzcAZZ');
        emailjs.sendForm('default_service', 'harwin_signs_contact_form', DOM.form)
          .then(resp => {
            DOM.form.classList.add('thanks');
            DOM.form.reset();
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
})();