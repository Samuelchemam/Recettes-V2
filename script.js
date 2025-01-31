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

// Charger les recettes depuis localStorage
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
    });
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
                    <h3>${recipe.title}</h3>
                    <div class="difficulty">
                        ${'★'.repeat(recipe.difficulty)}${'☆'.repeat(5 - recipe.difficulty)}
                    </div>
                    <p class="author">Par ${recipe.author}</p>
                </div>
                
                <div class="card-content">
                    <!-- Affichage des temps de préparation et de cuisson -->
                    <div class="time-info">
                        <p>⏲️ Préparation : ${recipe.prepTime} min</p>
                        <p>🔥 Cuisson : ${recipe.cookTime} min</p>
                    </div>
                    
                    <!-- Affichage des catégories sous forme de tags -->
                    <div class="categories-tags">
                        ${recipe.categories ? recipe.categories.map(cat => 
                            `<span class="category-tag">${cat}</span>`
                        ).join('') : ''}
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
        recipesContainer.innerHTML = '<p>Erreur lors de l\'affichage des recettes</p>';
    }
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
document.addEventListener('DOMContentLoaded', loadRecipes);
// Exemple d'implementation de toast notifications
function showNotification(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

// Utilisation
function saveRecipe() {
    try {
        // Logique de sauvegarde
        showNotification('Recette sauvegardée avec succès!');
    } catch (error) {
        showNotification('Erreur lors de la sauvegarde', 'error');
    }
}// Ajout dans le HTML
<div class="form-group">
    <label for="recipe-image">Photo de la recette</label>
    <input type="file" id="recipe-image" accept="image/*">
    <div class="image-preview"></div>
</div>

// JavaScript pour preview
const imageInput = document.getElementById('recipe-image');
imageInput.addEventListener('change', function(e) {
    const preview = document.querySelector('.image-preview');
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    }
    
    reader.readAsDataURL(file);
});
// HTML
<div class="advanced-filters">
    <div class="filter-group">
        <label>Temps de préparation</label>
        <select id="prep-time-filter">
            <option value="">Tous</option>
            <option value="15">< 15 min</option>
            <option value="30">< 30 min</option>
            <option value="60">< 1h</option>
        </select>
    </div>
    <div class="filter-group">
        <label>Difficulté</label>
        <div class="difficulty-slider">
            <input type="range" min="1" max="5" value="3">
        </div>
    </div>
</div>
.loading-state {
    position: relative;
    opacity: 0.7;
}

.loading-state::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 30px;
    height: 30px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}
/* Améliorations tactiles pour mobile */
@media (max-width: 768px) {
    .recipe-card {
        padding: 1.5rem;
    }
    
    button, 
    input[type="submit"] {
        min-height: 44px; /* Taille minimale pour les zones tactiles */
    }
    
    .form-group {
        margin-bottom: 1.5rem;
    }
    
    /* Menus déroulants plus faciles à toucher */
    select {
        padding: 12px;
    }
}
// Détection de la disposition optimale
function optimizeLayout() {
    const container = document.querySelector('.recipes-grid');
    const width = container.offsetWidth;
    const optimalColumns = Math.floor(width / 300); // 300px min par carte
    
    container.style.gridTemplateColumns = `repeat(${optimalColumns}, 1fr)`;
}

window.addEventListener('resize', optimizeLayout);
