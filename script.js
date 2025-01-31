// script.js
// Initialisation de Firebase avec ta config
const app = firebase.initializeApp({
    apiKey: "AIzaSyAm_iCfNAKBb4KE_UhCDFq25ZA0Q0-MNfA",
    authDomain: "site-web-recettes.firebaseapp.com",
    databaseURL: "https://site-web-recettes-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "site-web-recettes",
    storageBucket: "site-web-recettes.firebasestorage.app",
    messagingSenderId: "616026617837",
    appId: "1:616026617837:web:8de2604f97a5633094d9e4",
    measurementId: "G-9R9TMNM9JY"
  });
  // À ajouter après l'initialisation
if (firebase.apps.length) {
    console.log("Firebase est correctement initialisé");
} else {
    console.error("Erreur d'initialisation de Firebase");
} 
  const database = firebase.database();
let recipes = [];
const recipesContainer = document.getElementById('recipes-container');
const recipeForm = document.getElementById('recipe-form');

//Charger les recettes depuis localStorage
function loadRecipes() {
    database.ref('recipes').once('value', (snapshot) => {
        recipes = [];
        snapshot.forEach((childSnapshot) => {
            const recipe = { id: childSnapshot.key, ...childSnapshot.val() };
            recipes.push(recipe);
        });
        displayRecipes(recipes);  // Affiche les recettes
    }, (error) => {
        console.error("Erreur lors du chargement des recettes :", error);
    });//
    
}
        function toggleFavoritesView() {
            const recipesGrid = document.querySelector('.recipes-grid');
        recipesGrid.parentNode.insertBefore(returnBtn, recipesGrid);
            // Si aucun favori, afficher un message
            if (favoriteRecipes.length === 0) {
                showNotification("Aucune recette en favoris", "info");
                return;
            }
            
            // Afficher uniquement les recettes favorites
            displayRecipes(favoriteRecipes);
            showNotification("Affichage des favoris", "success");
            // Ajouter une option pour revenir à toutes les recettes
            const returnBtn = document.createElement('button');
            returnBtn.className = 'return-btn';
            returnBtn.innerHTML = '← Retour à toutes les recettes';
            returnBtn.onclick = () => {
                returnBtn.remove();
                displayRecipes(recipes);
            };
            
            // Insérer le bouton de retour avant la grille de recettes
            recipesGrid.parentNode.insertBefore(returnBtn, recipesGrid);
            
            showNotification("Affichage des favoris", "success");
        }
// Au début de script.js, après la déclaration des variables existantes
const CATEGORIES = [
    'Entrée', 'Plat principal', 'Dessert', 'Boisson', 
    'Végétarien', 'Vegan', 'Sans gluten'
];

// Basculer le thème sombre/clair
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

// Ajouter une nouvelle recette
// Dans script.js, modifiez la partie du addEventListener du form
recipeForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const recipe = {
        title: document.getElementById('title').value,
        author: document.getElementById('author').value,
        difficulty: parseInt(document.getElementById('difficulty').value),
        ingredients: document.getElementById('ingredients').value.split('\n').filter(i => i.trim()),
        steps: document.getElementById('steps').value.split('\n').filter(s => s.trim()),
        date: new Date().toLocaleDateString(),
        categories: Array.from(document.getElementById('categories').selectedOptions).map(option => option.value),
        prepTime: parseInt(document.getElementById('prepTime').value) || 0,
        cookTime: parseInt(document.getElementById('cookTime').value) || 0,
        favorite: false
    };

    // Ajouter la recette à Realtime Database
    database.ref('recipes').push(recipe, (error) => {
        if (error) {
            console.error("Erreur lors de l'ajout de la recette :", error);
        } else {
            loadRecipes();  // Recharge les recettes après l’ajout
            recipeForm.reset();  // Réinitialise le formulaire
        }
    });
});
// Afficher les recettes
function displayRecipes(recipesToShow) {
    try {
        recipesContainer.innerHTML = recipesToShow.map((recipe, index) => `
            <div class="recipe-card" onclick="toggleExpand(${index})" data-expanded="false">
                <div class="card-header">
                    <div class="card-header-top">
                        <h3>${recipe.title}</h3>
                        <button class="favorite-btn" onclick="toggleFavorite('${recipe.id}', ${index}); event.stopPropagation()">
                            ${recipe.favorite ? '❤️' : '🤍'}
                        </button>
                    </div>
                    <div class="difficulty">
                        ${'★'.repeat(recipe.difficulty)}${'☆'.repeat(5 - recipe.difficulty)}
                    </div>
                    <p class="author">Par ${recipe.author}</p>
                    <div class="recipe-quick-info">
                        <span class="time-badge">⏱️ ${recipe.prepTime + recipe.cookTime} min</span>
                    </div>
                    <div class="categories-tags">
                        ${recipe.categories ? recipe.categories.map(cat => 
                            `<span class="category-tag">${cat}</span>`
                        ).join('') : ''}
                    </div>
                </div>
                <div class="card-content">
                    <div class="time-info">
                        <p>⏲️ Préparation : ${recipe.prepTime} min</p>
                        <p>🔥 Cuisson : ${recipe.cookTime} min</p>
                    </div>
                    <div class="ingredients-section">
                        <h4>Ingrédients :</h4>
                        <ul>${recipe.ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
                    </div>
                    <div class="steps-section">
                        <h4>Étapes :</h4>
                        <ol>${recipe.steps.map(s => `<li>${s}</li>`).join('')}</ol>
                    </div>
                    <div class="card-actions">
                        <button class="edit-btn" onclick="editRecipe(${index}); event.stopPropagation()">✏️ Modifier</button>
                        <button class="delete-btn" onclick="deleteRecipe(${index}); event.stopPropagation()">🗑️ Supprimer</button>
                    </div>
                </div>
            </div>
        `).join('');
        animateDifficultyStars();
    } catch (e) {
        console.error("Erreur lors de l'affichage des recettes :", e);
        showNotification("Erreur d'affichage", "error");
    }
}
function toggleFavorite(recipeId, index) {
    console.log("Toggle favorite pour recette:", recipeId, "à l'index:", index); // Debug

    // Trouver la recette dans le tableau
    const recipe = recipes[index];
    if (!recipe) {
        console.error("Recette non trouvée");
        return;
    }

    // Inverser l'état du favori
    const newFavoriteState = !recipe.favorite;
    
    // Référence Firebase
    const recipeRef = database.ref(`recipes/${recipeId}`);
    
    // Mise à jour dans Firebase
    recipeRef.update({
        favorite: newFavoriteState
    }).then(() => {
        // Mise à jour locale
        recipe.favorite = newFavoriteState;
        
        // Mise à jour visuelle
        const favoriteBtn = document.querySelectorAll('.favorite-btn')[index];
        if (favoriteBtn) {
            favoriteBtn.innerHTML = newFavoriteState ? '❤️' : '🤍';
            favoriteBtn.classList.toggle('active');
            
            // Animation
            favoriteBtn.classList.add('favorite-animation');
            setTimeout(() => {
                favoriteBtn.classList.remove('favorite-animation');
            }, 500);
            
            // Notification
            showNotification(
                newFavoriteState ? 'Ajouté aux favoris' : 'Retiré des favoris',
                'success'
            );
        }
    }).catch(error => {
        console.error("Erreur lors de la mise à jour du favori:", error);
        showNotification("Erreur lors de la mise à jour du favori", "error");
    });
}
// Basculer l'expansion des cartes
function toggleExpand(index) {
    const card = document.querySelectorAll('.recipe-card')[index];
    const isExpanded = card.getAttribute('data-expanded') === 'true';
    
    card.setAttribute('data-expanded', !isExpanded);
    card.classList.toggle('expanded');
}
// Supprimer une recette
function deleteRecipe(index) {
    const recipeId = recipes[index].id;
    
    if (confirm("Supprimer cette recette ?")) {
        database.ref('recipes/' + recipeId).remove().then(() => {
            loadRecipes();  // Recharge les recettes après la suppression
        }).catch((error) => {
            console.error("Erreur lors de la suppression de la recette :", error);
        });
    }
}
// Modifier une recette
// Modifier une recette
function editRecipe(index) {
    const recipe = recipes[index];
    const card = document.querySelectorAll('.recipe-card')[index];
    
    const editForm = `
        <div class="edit-form" onclick="event.stopPropagation()">
            <div class="form-group">
                <label for="edit-title">Titre</label>
                <input type="text" class="edit-title" value="${recipe.title}" onclick="event.stopPropagation()">
            </div>
            
            <div class="form-group">
                <label for="edit-author">Auteur</label>
                <input type="text" class="edit-author" value="${recipe.author}" onclick="event.stopPropagation()">
            </div>
            
            <div class="form-group">
                <label for="edit-difficulty">Difficulté</label>
                <select class="edit-difficulty" onclick="event.stopPropagation()">
                    ${[1, 2, 3, 4, 5].map(n => `
                        <option value="${n}" ${n === recipe.difficulty ? 'selected' : ''}>${n}</option>
                    `).join('')}
                </select>
            </div>

            <div class="form-group">
                <label for="edit-categories">Catégories</label>
                <select class="edit-categories" multiple onclick="event.stopPropagation()">
                    ${CATEGORIES.map(cat => `
                        <option value="${cat}" ${recipe.categories?.includes(cat) ? 'selected' : ''}>${cat}</option>
                    `).join('')}
                </select>
            </div>

            <div class="form-group">
                <label for="edit-prepTime">Temps de préparation (minutes)</label>
                <input type="number" class="edit-prepTime" value="${recipe.prepTime || 0}" min="0" onclick="event.stopPropagation()">
            </div>

            <div class="form-group">
                <label for="edit-cookTime">Temps de cuisson (minutes)</label>
                <input type="number" class="edit-cookTime" value="${recipe.cookTime || 0}" min="0" onclick="event.stopPropagation()">
            </div>

            <div class="form-group">
                <label for="edit-ingredients">Ingrédients (un par ligne)</label>
                <textarea class="edit-ingredients" rows="4" onclick="event.stopPropagation()">${recipe.ingredients.join('\n')}</textarea>
            </div>
            
            <div class="form-group">
                <label for="edit-steps">Étapes (un par ligne)</label>
                <textarea class="edit-steps" rows="4" onclick="event.stopPropagation()">${recipe.steps.join('\n')}</textarea>
            </div>
            
            <button onclick="saveEdit(${index}); event.stopPropagation()">💾 Enregistrer</button>
            <button onclick="displayRecipes(recipes); event.stopPropagation()" class="cancel-btn">❌ Annuler</button>
        </div>
    `;
    
    card.querySelector('.card-content').innerHTML = editForm;
}
// Sauvegarder les modifications
function saveEdit(index) {
    const card = document.querySelectorAll('.recipe-card')[index];
    const recipeId = recipes[index].id;

    const updatedRecipe = {
        title: card.querySelector('.edit-title').value,
        author: card.querySelector('.edit-author').value,
        difficulty: parseInt(card.querySelector('.edit-difficulty').value),
        categories: Array.from(card.querySelector('.edit-categories').selectedOptions).map(option => option.value),
        prepTime: parseInt(card.querySelector('.edit-prepTime').value) || 0,
        cookTime: parseInt(card.querySelector('.edit-cookTime').value) || 0,
        ingredients: card.querySelector('.edit-ingredients').value.split('\n').filter(i => i.trim()),
        steps: card.querySelector('.edit-steps').value.split('\n').filter(s => s.trim()),
        date: new Date().toLocaleDateString()
    };

    // Met à jour la recette dans Firebase
    database.ref('recipes/' + recipeId).update(updatedRecipe).then(() => {
        loadRecipes();  // Recharge les recettes après la mise à jour
    }).catch((error) => {
        console.error("Erreur lors de la mise à jour de la recette :", error);
    });
}
// Rechercher des recettes
function searchRecipes() {
    const searchTerm = document.querySelector('.search-bar').value.toLowerCase();
    const filteredRecipes = recipes.filter(recipe => 
        recipe.title.toLowerCase().includes(searchTerm) ||
        recipe.ingredients.some(i => i.toLowerCase().includes(searchTerm))
    );
    displayRecipes(filteredRecipes);
}

// Animation des étoiles
function animateDifficultyStars() {
    document.querySelectorAll('.difficulty').forEach(star => {
        star.addEventListener('mouseover', () => {
            star.style.animation = 'sparkle 0.6s ease-out';
        });
        star.addEventListener('animationend', () => {
            star.style.animation = '';
        });
    });
}

// Chargement initial
document.addEventListener('DOMContentLoaded', () => {
    loadRecipes();
    initializeFilters(); // Ajoutez cette ligne
});
// Système de notifications
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Système de pagination
let currentPage = 1;
const recipesPerPage = 6;

function paginateRecipes(recipesArray) {
    const start = (currentPage - 1) * recipesPerPage;
    const end = start + recipesPerPage;
    return recipesArray.slice(start, end);
}

// Gestion des filtres
function initializeFilters() {
    const filterCategory = document.querySelector('.filter-category');
    const filterDifficulty = document.querySelector('.filter-difficulty');
    const filterTime = document.querySelector('.filter-time');
    
    // Vider d'abord les options existantes
    filterCategory.innerHTML = '<option value="">Toutes les catégories</option>';
    filterDifficulty.innerHTML = '<option value="">Toutes les difficultés</option>';
    filterTime.innerHTML = '<option value="">Tous les temps</option>';

    // Remplir les catégories
    CATEGORIES.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        filterCategory.appendChild(option);
    });

    // Remplir les difficultés
    const difficulties = [
        { value: "1", label: "Très facile" },
        { value: "2", label: "Facile" },
        { value: "3", label: "Moyen" },
        { value: "4", label: "Difficile" },
        { value: "5", label: "Très difficile" }
    ];
    
    difficulties.forEach(diff => {
        const option = document.createElement('option');
        option.value = diff.value;
        option.textContent = diff.label;
        filterDifficulty.appendChild(option);
    });

    // Remplir les temps
    const timeRanges = [
        { value: "15", label: "< 15 min" },
        { value: "30", label: "< 30 min" },
        { value: "60", label: "< 1h" },
        { value: "61", label: "> 1h" }
    ];
    
    timeRanges.forEach(time => {
        const option = document.createElement('option');
        option.value = time.value;
        option.textContent = time.label;
        filterTime.appendChild(option);
    });

    // Écouteurs d'événements pour les filtres
    [filterCategory, filterDifficulty, filterTime].forEach(filter => {
        filter.addEventListener('change', applyFilters);
    });

    // Ajouter un écouteur pour le bouton de réinitialisation
    const clearFiltersBtn = document.querySelector('.clear-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            filterCategory.value = '';
            filterDifficulty.value = '';
            filterTime.value = '';
            displayRecipes(recipes);
        });
    }
}
function applyFilters() {
    const category = document.querySelector('.filter-category').value;
    const difficulty = document.querySelector('.filter-difficulty').value;
    const time = document.querySelector('.filter-time').value;

    let filteredRecipes = [...recipes];

    // Filtre par catégorie
    if (category) {
        filteredRecipes = filteredRecipes.filter(recipe => 
            recipe.categories && recipe.categories.includes(category));
    }

    // Filtre par difficulté
    if (difficulty) {
        filteredRecipes = filteredRecipes.filter(recipe => 
            recipe.difficulty === parseInt(difficulty));
    }

    // Filtre par temps total
    if (time) {
        filteredRecipes = filteredRecipes.filter(recipe => {
            const totalTime = recipe.prepTime + recipe.cookTime;
            if (time === "61") {
                return totalTime > 60;
            }
            return totalTime <= parseInt(time);
        });
    }

    // Afficher les recettes filtrées
    displayRecipes(filteredRecipes);
}
// Modifier votre fonction loadRecipes existante
function loadRecipes() {
    showLoadingState();
    database.ref('recipes').once('value', (snapshot) => {
        recipes = [];
        snapshot.forEach((childSnapshot) => {
            const recipe = { id: childSnapshot.key, ...childSnapshot.val() };
            recipes.push(recipe);
        });
        displayRecipes(recipes);
        initializeFilters();
    }, (error) => {
        console.error("Erreur lors du chargement des recettes :", error);
        showNotification("Erreur lors du chargement des recettes", "error");
    });
} // Ajout de l'état de chargement
    // Ajoutez cette nouvelle fonction après showLoadingState
        // Filtrer les recettes favorites
        const favoriteRecipes = recipes.filter(recipe => recipe.favorite);
        
        // Vérifier s'il y a des favoris
        if (favoriteRecipes.length === 0) {
            showNotification("Aucune recette en favoris", "info");
        }
        
        // Créer le bouton retour s'il n'existe pas déjà
        if (!document.querySelector('.return-btn')) {
            const returnBtn = document.createElement('button');
            returnBtn.className = 'return-btn';
            returnBtn.innerHTML = '← Retour à toutes les recettes';
            returnBtn.onclick = () => {
                returnBtn.remove();
                displayRecipes(recipes);
            };
            displayRecipes(favoriteRecipes);
    showNotification("Affichage des favoris", "success");
}
        // Ajoutez cette ligne pour mettre à jour la section favoris
        const favoritesContainer = document.getElementById('favorites-container');
        if (!favoritesContainer.classList.contains('hidden')) {
            toggleFavoritesView();
        }
    database.ref('recipes').once('value', (snapshot) => {
        recipes = [];
        snapshot.forEach((childSnapshot) => {
            const recipe = { id: childSnapshot.key, ...childSnapshot.val() };
            recipes.push(recipe);
        });
        displayRecipes(paginateRecipes(recipes)); // Utilisation de la pagination
        initializeFilters(); // Initialisation des filtres
    }, (error) => {
        console.error("Erreur lors du chargement des recettes :", error);
        showNotification("Erreur lors du chargement des recettes", "error");
    });
// État de chargement
function showLoadingState() {
    recipesContainer.innerHTML = Array(6).fill(`
        <div class="recipe-card loading-skeleton">
            <div class="skeleton-header"></div>
            <div class="skeleton-body"></div>
        </div>
    `).join('');
}
// Gestionnaire du modal et des filtres
document.addEventListener('DOMContentLoaded', () => {
    const addRecipeBtn = document.getElementById('add-recipe-btn');
    const modal = document.getElementById('recipe-modal');
    const closeModal = document.querySelector('.close-modal');
    const filterToggle = document.querySelector('.filter-toggle');
    const filtersSection = document.querySelector('.filters-section');

    // Gestion du modal
    addRecipeBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    closeModal.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    // Fermeture du modal en cliquant à l'extérieur
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    // Toggle des filtres
    filterToggle.addEventListener('click', () => {
        filtersSection.classList.toggle('hidden');
    });
});
