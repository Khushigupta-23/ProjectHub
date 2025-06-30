document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search');
  const suggestionsDiv = document.getElementById('suggestions');

  searchInput.addEventListener('input', async () => {
    const query = searchInput.value.trim();
    if (query.length < 2) {
      suggestionsDiv.innerHTML = '';
      suggestionsDiv.classList.add('hidden');
      return;
    }

    try {
      const response = await fetch(`/listings/suggestions?q=${encodeURIComponent(query)}`);
      const suggestions = await response.json();
      suggestionsDiv.innerHTML = '';

      if (suggestions.length > 0) {
        suggestions.forEach(suggestion => {
          const div = document.createElement('div');
          div.className = 'px-4 py-2 hover:bg-gray-100 cursor-pointer';
          div.textContent = suggestion;
          div.addEventListener('click', () => {
            searchInput.value = suggestion;
            suggestionsDiv.innerHTML = '';
            suggestionsDiv.classList.add('hidden');
          });
          suggestionsDiv.appendChild(div);
        });
        suggestionsDiv.classList.remove('hidden');
      } else {
        suggestionsDiv.classList.add('hidden');
      }
    } catch (err) {
      suggestionsDiv.innerHTML = '';
      suggestionsDiv.classList.add('hidden');
    }
  });

  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
      suggestionsDiv.classList.add('hidden');
    }
  });
});