document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', () => {
      const spinner = form.querySelector('#spinner');
      if (spinner) {
        spinner.classList.remove('hidden');
      }
    });
  });
});