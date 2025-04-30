document.addEventListener('DOMContentLoaded', function () {
    let totalQuestionCount = 0;
    for (const category in allQuestions) {
        totalQuestionCount += allQuestions[category].length;
    }
    document.getElementById('totalCount').textContent = `Insgesamt ${totalQuestionCount} Fragen`;

    // Checkbox für das Ein-/Ausblenden der Häkchen
    const toggleCheckmarks = document.getElementById('toggleCheckmarks');
    toggleCheckmarks.addEventListener('change', function () {
        const container = document.getElementById('questionsListContainer');
        if (this.checked) {
            container.classList.remove('hide-checkmarks');
        } else {
            container.classList.add('hide-checkmarks');
        }
    });

    function renderQuestionsByCategory(category) {
        const container = document.getElementById('questionsListContainer');
        container.innerHTML = ''; // Container leeren

        if (!allQuestions[category] && category !== 'all') {
            container.innerHTML = '<p>Keine Fragen in dieser Kategorie gefunden.</p>';
            return;
        }

        if (category === 'all') {
            for (const cat in allQuestions) {
                const categoryTitle = document.createElement('h2');
                categoryTitle.classList.add('category-title');

                let displayName = cat;
                // Formatiere Kategorienamen für die Anzeige
                switch (cat) {
                    case 'it-sicherheit':
                        displayName = 'IT-Sicherheit';
                        break;
                    case 'backup':
                        displayName = 'Backup';
                        break;
                    case 'zugriffsrechte':
                        displayName = 'Zugriffsrechte';
                        break;
                    case 'notfall':
                        displayName = 'Notfallmanagement';
                        break;
                    case 'risiko':
                        displayName = 'Risikomanagement';
                        break;
                    default:
                        displayName = cat;
                }

                categoryTitle.textContent = displayName;
                container.appendChild(categoryTitle);

                allQuestions[cat].forEach(question => {
                    container.appendChild(createQuestionElement(question));
                });
            }
        } else {
            allQuestions[category].forEach(question => {
                container.appendChild(createQuestionElement(question));
            });
        }
    }

    function createQuestionElement(question) {
        const questionContainer = document.createElement('div');
        questionContainer.classList.add('question-container');

        const questionElement = document.createElement('h3');
        questionElement.classList.add('question');
        questionElement.textContent = `${question.id}. ${question.question}`;

        const optionsList = document.createElement('ul');
        optionsList.classList.add('answer-options');

        question.options.forEach(option => {
            const optionItem = document.createElement('li');
            optionItem.classList.add('answer-option');
            if (option.correct) {
                optionItem.classList.add('correct');
            }

            const marker = document.createElement('span');
            marker.classList.add('answer-marker');

            const optionText = document.createElement('span');
            optionText.classList.add('answer-text');
            optionText.textContent = option.text;

            optionItem.appendChild(marker);
            optionItem.appendChild(optionText);
            optionsList.appendChild(optionItem);
        });

        questionContainer.appendChild(questionElement);
        questionContainer.appendChild(optionsList);

        return questionContainer;
    }

    function searchQuestions() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        const selectedCategory = 'all';

        const container = document.getElementById('questionsListContainer');
        container.innerHTML = ''; // Container leeren

        let matchCount = 0;

        const categoriesToSearch = selectedCategory === 'all' ? Object.keys(allQuestions) : [selectedCategory];

        categoriesToSearch.forEach(category => {
            const matchingQuestions = allQuestions[category].filter(question => {
                // In Frage und Antwortoptionen suchen
                const questionText = question.question.toLowerCase();
                const optionsText = question.options.map(opt => opt.text.toLowerCase()).join(' ');

                return questionText.includes(searchTerm) || optionsText.includes(searchTerm);
            });

            if (matchingQuestions.length > 0) {
                // Kategorie-Überschrift hinzufügen
                const categoryTitle = document.createElement('h2');
                categoryTitle.classList.add('category-title');

                // Kategoriename anpassen
                let displayName = category;
                switch (category) {
                    case 'it-sicherheit':
                        displayName = 'IT-Sicherheit';
                        break;
                    case 'backup':
                        displayName = 'Backup';
                        break;
                    case 'zugriffsrechte':
                        displayName = 'Zugriffsrechte';
                        break;
                    case 'notfall':
                        displayName = 'Notfallmanagement';
                        break;
                    case 'risiko':
                        displayName = 'Risikomanagement';
                        break;
                    default:
                        displayName = category;
                }

                categoryTitle.textContent = displayName;
                container.appendChild(categoryTitle);

                // Gefundene Fragen anzeigen
                matchingQuestions.forEach(question => {
                    container.appendChild(createQuestionElement(question));
                });

                matchCount += matchingQuestions.length;
            }
        });

        // Suchergebnisse anzeigen
        document.getElementById('resultCount').textContent =
            matchCount > 0
                ? `${matchCount} ${matchCount === 1 ? 'Ergebnis' : 'Ergebnisse'} gefunden`
                : '';

        // "Keine Ergebnisse" Meldung anzeigen/verstecken
        document.getElementById('noResults').style.display =
            matchCount === 0 ? 'block' : 'none';
    }

    // Event Listener für die Suche
    document.getElementById('searchInput').addEventListener('input', searchQuestions);

    // Initial alle Fragen anzeigen
    renderQuestionsByCategory('all');
});