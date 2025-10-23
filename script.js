// Global error handler
window.addEventListener('error', (event) => {
  try {
    console.error('[GlobalError]', {
      message: event?.message,
      filename: event?.filename,
      lineno: event?.lineno,
      colno: event?.colno,
      error: event?.error
    });
  } catch (e) {}
});

// Helpers DOM sécurisés
const getById = (id) => { try { return document.getElementById(id) || null; } catch { return null; } };
const qs = (sel, root=document) => { try { return (root && root.querySelector) ? root.querySelector(sel) : null; } catch { return null; } };
const qsa = (sel, root=document) => { try { return (root && root.querySelectorAll) ? root.querySelectorAll(sel) : []; } catch { return []; } };
const on = (el, ev, fn, opts) => { if (el && el.addEventListener) { try { el.addEventListener(ev, fn, opts); } catch(e){ console.error(e);} } };
const safeSetHTML = (el, html) => { if (el) { try { el.innerHTML = html; } catch(e){ console.error(e);} } };
const safeAppend = (el, child) => { if (el && child) { try { el.appendChild(child); } catch(e){ console.error(e);} } };
const safeText = (el, text) => { if (el) { try { el.textContent = text; } catch(e){ console.error(e);} } };
const safeValue = (el) => { try { return el ? el.value : ''; } catch { return ''; } };

// Initialisation Firebase
let app = null; let database = null;
try {
  app = firebase.initializeApp({
    apiKey: "AIzaSyAm_iCfNAKBb4KE_UhCDFq25ZA0Q0-MNfA",
    authDomain: "site-web-recettes.firebaseapp.com",
    databaseURL: "https://site-web-recettes-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "site-web-recettes",
    storageBucket: "site-web-recettes.firebasestorage.app",
    messagingSenderId: "616026617837",
    appId: "1:616026617837:web:8de2604f97a5633094d9e4",
    measurementId: "G-9R9TMNM9JY"
  });
  if (firebase.apps.length) console.log('Firebase est correctement initialisé'); else console.error("Erreur d'initialisation de Firebase");
  try { database = firebase.database(); } catch(e){ console.error(e); }
} catch(e) { console.error('Erreur init Firebase', e); }

let recipes = [];
const recipesContainer = getById('recipes-container');
const recipeForm = getById('recipe-form');
const CATEGORIES = ['Entrée','Plat principal','Dessert','Boisson','Végétarien','Vegan','Sans gluten'];

function loadRecipes(){
  showLoadingState();
  if (!database) return;
  try {
    database.ref('recipes').once('value', (snapshot)=>{
      recipes = [];
      snapshot.forEach((child)=>{
        const val = child.val() || {};
        const r = { id: child.key, ...val };
        r.categories = Array.isArray(r.categories) ? r.categories : [];
        r.ingredients = Array.isArray(r.ingredients) ? r.ingredients : [];
        r.steps = Array.isArray(r.steps) ? r.steps : [];
        r.prepTime = Number(r.prepTime||0);
        r.cookTime = Number(r.cookTime||0);
        r.difficulty = Number(r.difficulty||0);
        r.portions = Number(r.portions||4);
        r.title = r.title || '';
        r.author = r.author || '';
        recipes.push(r);
      });
      console.log('Catégories des recettes:', recipes.map(r=>r.categories));
      displayRecipes(recipes);
      initializeFilters();
    }, (error)=>{
      console.error('Erreur lors du chargement des recettes :', error);
      showNotification('Erreur lors du chargement des recettes','error');
    });
  } catch(e){ console.error(e); }
}

function displayRecipes(recipesToShow){
  if (!Array.isArray(recipesToShow)) { console.error("recipesToShow n'est pas un tableau:", recipesToShow); recipesToShow = []; }
  try {
    if (recipesContainer) safeSetHTML(recipesContainer, '');
    recipesToShow.forEach((recipe, index)=>{
      const recipeCard = document.createElement('div');
      recipeCard.className = 'recipe-card';
      recipeCard.setAttribute('data-expanded','false');
      recipeCard.onclick = ()=>{ try { toggleExpand(index); } catch(e){ console.error(e);} };

      const safeCats = Array.isArray(recipe.categories) ? recipe.categories : [];
      const totalTime = Number(recipe.prepTime||0)+Number(recipe.cookTime||0);
      const portions = Number(recipe.portions||4);
      const ingredientsHTML = Array.isArray(recipe.ingredients) ? recipe.ingredients.map(i=>{
        try {
          const parts = String(i).split(' ');
          const quantity = parseFloat(parts[0]);
          const unit = parts[1] || '';
          const ingredient = parts.slice(2).join(' ');
          if (!isNaN(quantity)) return `<li data-ingredient="${ingredient}" data-original-quantity="${quantity}" data-unit="${unit}">${quantity} ${unit} ${ingredient}</li>`;
          return `${String(i)}`;
        } catch { return String(i); }
      }).join('') : '';
      const stepsHTML = Array.isArray(recipe.steps) ? recipe.steps.map(s=>`${s}`).join('') : '';

      recipeCard.innerHTML = `
        <div class="card-header">
          <div class="card-header">
            <div class="card-header-top">
              ${recipe.title || ''}
              <button class="favorite-btn ${isRecipeFavorite(recipe.id)?'active':''}" onclick="toggleFavorite('${recipe.id}','${(recipe.title||'').replace(/'/g, "\\'")}'); event.stopPropagation()">
                <i class="fas fa-heart"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="difficulty-container">
          <span class="difficulty-label">Difficulté</span>
          <div class="difficulty">${getDifficultyIcons(Number(recipe.difficulty||0))}</div>
        </div>
        <p class="author">Par ${recipe.author || ''}</p>
        <div class="recipe-quick-info">
          <span class="time-badge ${getTimeClass(totalTime)}">${getTimeIcon(totalTime)} ${totalTime} min</span>
        </div>
        <div class="categories-tags">${safeCats.map(cat=>`<span class="category-tag" data-category="${cat}">${cat}</span>`).join('')}</div>
        <div class="card-content">
          <div class="time-info">⏲️ Préparation : ${Number(recipe.prepTime||0)} min 🔥 Cuisson : ${Number(recipe.cookTime||0)} min</div>
          <div class="ingredients-section">
            Ingrédients :
            <div class="portions-calculator">
              Nombre de personnes :
              <div class="portions-controls">
                <button onclick="adjustPortions(${index}, 'decrease'); event.stopPropagation()">-</button>
                <span class="portions-count">${portions}</span>
                <button onclick="adjustPortions(${index}, 'increase'); event.stopPropagation()">+</button>
              </div>
            </div>
            <ul class="ingredients-list" data-base-portions="${portions}">${ingredientsHTML}</ul>
          </div>
          <div class="steps-section">Étapes : ${stepsHTML}</div>
          <div class="card-actions">
            <button class="action-btn comments-btn" onclick="showRecipeDetails(${JSON.stringify({ ...recipe, id: recipe.id })}); event.stopPropagation()"><i class="fas fa-comments"></i> Commentaires</button>
            <button class="action-btn edit-btn" onclick="editRecipe(${index}); event.stopPropagation()"><i class="fas fa-edit"></i> Modifier</button>
            <button class="action-btn delete-btn" onclick="deleteRecipe(${index}); event.stopPropagation()"><i class="fas fa-trash-alt"></i> Supprimer</button>
          </div>
        </div>`;

      safeAppend(recipesContainer, recipeCard);
    });
    animateDifficultyStars();
  } catch(e){ console.error("Erreur lors de l'affichage des recettes :", e); showNotification('Erreur d\'affichage','error'); }
}

function toggleTheme(){ try { document.body?.classList?.toggle('dark-mode'); } catch(e){ console.error(e);} }

// Formulaire d'ajout
if (recipeForm) on(recipeForm,'submit',function(event){
  try { event?.preventDefault?.(); } catch{}
  const recipe = {
    title: safeValue(getById('title')),
    author: safeValue(getById('author')),
    difficulty: parseInt(safeValue(getById('difficulty'))) || 0,
    ingredients: safeValue(getById('ingredients')).split('\n').filter(i=>i && i.trim()),
    steps: safeValue(getById('steps')).split('\n').filter(s=>s && s.trim()),
    date: new Date().toLocaleDateString(),
    categories: (getById('categories')?.selectedOptions ? Array.from(getById('categories').selectedOptions).map(o=>o.value) : []),
    prepTime: parseInt(safeValue(getById('prepTime'))) || 0,
    cookTime: parseInt(safeValue(getById('cookTime'))) || 0,
    portions: parseInt(safeValue(getById('portions'))) || 4
  };
  if (!database) return;
  try {
    database.ref('recipes').push(recipe, (error)=>{
      if (error) {
        console.error('Erreur lors de l\'ajout de la recette :', error);
      } else {
        loadRecipes();
        try { recipeForm.reset?.(); } catch{}
        const modal = getById('recipe-modal');
        modal?.classList?.add('hidden');
      }
    });
  } catch(e){ console.error(e); }
});

// DOMContentLoaded
on(document,'DOMContentLoaded',()=>{
  loadRecipes();
  initializeFilters();

  const addRecipeBtn = getById('add-recipe-btn');
  const modal = getById('recipe-modal');
  const closeModal = qs('.close-modal');
  const filterToggle = qs('.filter-toggle');
  const filtersSection = qs('.filters-section');

  if (addRecipeBtn && modal) on(addRecipeBtn,'click',()=>{ modal.classList?.remove('hidden'); });
  if (closeModal && modal) on(closeModal,'click',()=>{ modal.classList?.add('hidden'); });
  if (modal) on(modal,'click',(e)=>{ if (e?.target === modal) { modal.classList?.add('hidden'); } });
  if (filterToggle && filtersSection) on(filterToggle,'click',()=>{ filtersSection.classList?.toggle('hidden'); });
});

// Fonctions de gestion des recettes
function toggleExpand(index){
  const card = qsa('.recipe-card')[index];
  if (!card) return;
  try {
    const isExpanded = card.getAttribute?.('data-expanded') === 'true';
    card.setAttribute?.('data-expanded', (!isExpanded).toString());
    card.classList?.toggle('expanded');
  } catch(e){ console.error(e);} 
}

function deleteRecipe(index){
  const recipeId = recipes[index]?.id;
  if (!recipeId || !database) return;
  try {
    if (confirm('Supprimer cette recette ?')) {
      database.ref('recipes/'+recipeId).remove().then(()=>{ loadRecipes(); }).catch((error)=>{ console.error('Erreur lors de la suppression de la recette :', error); });
    }
  } catch(e){ console.error(e);} 
}

function editRecipe(index){
  const recipe = recipes[index] || {};
  const card = qsa('.recipe-card')[index];
  if (!card) return;
  const portions = Number(recipe.portions||4);
  const editForm = `
    <div class="edit-form" onclick="event.stopPropagation()">
      <div class="form-group"><label for="edit-title">Titre</label>
        <input class="edit-title" type="text" value="${recipe.title||''}" onclick="event.stopPropagation()"/>
      </div>
      <div class="form-group"><label for="edit-author">Auteur</label>
        <input class="edit-author" type="text" value="${recipe.author||''}" onclick="event.stopPropagation()"/>
      </div>
      <div class="form-group"><label for="edit-difficulty">Difficulté</label>
        <select class="edit-difficulty" onclick="event.stopPropagation()">
          ${[1,2,3,4,5].map(n=>`<option value="${n}" ${Number(recipe.difficulty)==n?'selected':''}>${n}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label for="edit-categories">Catégories</label>
        <select class="edit-categories" multiple onclick="event.stopPropagation()">
          ${CATEGORIES.map(cat=>`<option value="${cat}" ${Array.isArray(recipe.categories)&&recipe.categories.includes(cat)?'selected':''}>${cat}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label for="edit-prepTime">Temps de préparation (minutes)</label>
        <input class="edit-prepTime" type="number" min="0" value="${Number(recipe.prepTime||0)}" onclick="event.stopPropagation()"/>
      </div>
      <div class="form-group"><label for="edit-cookTime">Temps de cuisson (minutes)</label>
        <input class="edit-cookTime" type="number" min="0" value="${Number(recipe.cookTime||0)}" onclick="event.stopPropagation()"/>
      </div>
      <div class="form-group"><label for="edit-ingredients">Ingrédients (un par ligne)</label>
        <div class="portions-calculator">Nombre de personnes :
          <div class="portions-controls">
            <button onclick="adjustPortionsEdit(${index}, 'decrease'); event.stopPropagation()">-</button>
            <span class="portions-count-edit">${portions}</span>
            <button onclick="adjustPortionsEdit(${index}, 'increase'); event.stopPropagation()">+</button>
          </div>
        </div>
        <textarea class="edit-ingredients" rows="4" data-base-portions="${portions}" onclick="event.stopPropagation()">${Array.isArray(recipe.ingredients)?recipe.ingredients.join('\n'):''}</textarea>
      </div>
      <div class="form-group"><label for="edit-steps">Étapes (un par ligne)</label>
        <textarea class="edit-steps" rows="4" onclick="event.stopPropagation()">${Array.isArray(recipe.steps)?recipe.steps.join('\n'):''}</textarea>
      </div>
      <button onclick="saveEdit(${index}); event.stopPropagation()">💾 Enregistrer</button>
      <button class="cancel-btn" onclick="displayRecipes(recipes); event.stopPropagation()">❌ Annuler</button>
    </div>`;
  try {
    const content = qs('.card-content', card);
    safeSetHTML(content, editForm);
  } catch(e){ console.error(e);} 
}

function saveEdit(index){
  const card = qsa('.recipe-card')[index];
  const recipeId = recipes[index]?.id;
  if (!card || !recipeId || !database) return;
  try {
    const updatedRecipe = {
      title: qs('.edit-title', card)?.value || '',
      author: qs('.edit-author', card)?.value || '',
      difficulty: parseInt(qs('.edit-difficulty', card)?.value) || 0,
      categories: (qs('.edit-categories', card)?.selectedOptions ? Array.from(qs('.edit-categories', card).selectedOptions).map(o=>o.value) : []),
      prepTime: parseInt(qs('.edit-prepTime', card)?.value) || 0,
     
