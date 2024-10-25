const Main_URL = 'http://test.zerorder.kr/products'

// 카테고리 조회
const CATEGORY_API_URL = `${Main_URL}/categories`;

const categorySelect = document.getElementById('category-id');
const modalCategorySelect = document.getElementById('modal-category-id');

async function fetchCategories() {
  try {
    const response = await fetch(CATEGORY_API_URL);
    if (!response.ok) {
      throw new Error('카테고리 정보를 불러오는 데 실패했습니다.');
    }
    const categories = await response.json();
    populateCategorySelect(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
}


function populateCategorySelect(categories) {
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;

    categorySelect.appendChild(option.cloneNode(true));
    modalCategorySelect.appendChild(option);
  });
}

// 상품 조회
const productNameInput = document.getElementById('product-name');
const manufacturerInput = document.getElementById('manufacturer');
const searchButton = document.querySelector('.button--search');
const tableBody = document.querySelector('tbody');
const pageContainer = document.querySelector('.page-container');

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 날짜 형식 변환 (YYYY-MM-DD)
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; 
}


function renderTable(items) {
  tableBody.innerHTML = ''; 
  items.forEach(item => {
    const row = `
      <tr>
        <td>${item.id}</td>
        <td>${item.name}</td>
        <td>${item.categoryName}</td>
        <td>${formatNumber(item.price)} 원</td>
        <td>${formatNumber(item.stock)} 개</td>
        <td>${item.rating}</td>
        <td>${item.manufacturer}</td>
        <td>${formatDate(item.createdAt)}</td>
      </tr>
    `;
    tableBody.insertAdjacentHTML('beforeend', row);
  });
}

// 페이지네이션 UI 생성
function renderPagination(totalPages, currentPage) {
  pageContainer.innerHTML = ''; 
  const maxPageButtons = 5;

  let startPage = Math.max(currentPage - Math.floor(maxPageButtons / 2), 1);
  let endPage = startPage + maxPageButtons - 1;

// 빈 데이터 페이지가 생길 경우 페이지 네이션 제거
//   if (endPage > totalPages) {
//     endPage = totalPages;
//     startPage = Math.max(endPage - maxPageButtons + 1, 1);
//   }


  const ul = document.createElement('ul');

  for (let i = startPage; i <= endPage; i++) {
    const li = document.createElement('li');
    li.classList.toggle('active', i === currentPage);
    li.innerHTML = `<a href="#">${i}</a>`;
    li.addEventListener('click', () => fetchProducts(i)); 
    ul.appendChild(li);
  }

  pageContainer.appendChild(ul);
}


async function fetchProducts(page = 1) {
  const productName = productNameInput.value;
  const manufacturer = manufacturerInput.value;
  const categoryId = categorySelect.value;

  const url = `${Main_URL}?productName=${productName}&manufacturer=${manufacturer}&categoryId=${categoryId}&page=${page}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    renderTable(data.items); 
    renderPagination(data.totalPages, data.currentPage); 
  } catch (error) {
    console.error('상품 조회에 실패했습니다:', error);
  }
}

// 조회하기 버튼 클릭 시 호출
searchButton.addEventListener('click', (e) => {
  e.preventDefault(); 
  fetchProducts(); 
});


// 정렬
let sortOrder = 'desc'; 

document.querySelectorAll('th').forEach((header, index) => {
  header.addEventListener('click', () => {
    sortOrder = sortOrder === 'desc' ? 'asc' : 'desc'; 
    sortTable(index, sortOrder);
  });
});

function sortTable(columnIndex, order) {
  const rows = Array.from(tableBody.querySelectorAll('tr'));

  rows.sort((a, b) => {
    const aText = a.cells[columnIndex].textContent.trim();
    const bText = b.cells[columnIndex].textContent.trim();

    const aValue = isNaN(aText) ? aText : parseFloat(aText.replace(/,/g, ''));
    const bValue = isNaN(bText) ? bText : parseFloat(bText.replace(/,/g, ''));

    if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
    });

  tableBody.innerHTML = '';
  rows.forEach(row => tableBody.appendChild(row));
}



window.addEventListener('load', () => {
  fetchCategories();
  fetchProducts();
});


// 모달 상품 추가하기

const modal = document.querySelector('.modal');
const closeButton = document.querySelector('.header__close');
const backdrop = document.querySelector('.modal__backdrop');
const addProductButton = document.querySelector('.button--add');
const modalForm = document.querySelector('.contents__form');

const modalProductName = document.getElementById('modal-product-name');
const modalPrice = document.getElementById('modal-price');
const modalStock = document.getElementById('modal-stock');
const modalRating = document.getElementById('modal-rating');
const modalManufacturer = document.getElementById('modal-manufacturer');


addProductButton.addEventListener('click', () => {
  modal.classList.remove('hidden');
});


const closeModal = () => modal.classList.add('hidden');
closeButton.addEventListener('click', closeModal);
backdrop.addEventListener('click', closeModal);

function validateNumberInput(input, minValue = 1, step = 1) {
  input.addEventListener('input', () => {
    if (input.value < minValue) input.value = minValue;
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') input.stepUp(step);
    if (e.key === 'ArrowDown') input.stepDown(step);
  });
}

validateNumberInput(modalPrice, 100, 100); 
validateNumberInput(modalStock); 
validateNumberInput(modalRating, 0.1, 0.1); 

// 상품 추가 API 호출
async function addProduct() {
  const product = {
    productName: modalProductName.value.trim(),
    categoryId: Number(modalCategorySelect.value),
    price: Number(modalPrice.value),
    stock: Number(modalStock.value),
    rating: Number(modalRating.value),
    manufacturer: modalManufacturer.value.trim(),
  };

  if (Object.values(product).some((value) => !value)) {
    alert('모든 항목을 입력해 주세요.');
    return;
  }

  try {
    const response = await fetch('http://test.zerorder.kr/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });

    if (!response.ok) throw new Error('상품 추가에 실패했습니다.');

    alert('상품이 성공적으로 추가되었습니다!');
    closeModal(); 
    window.location.href = '/'; 
  } catch (error) {
    console.error('상품 추가 에러:', error);
    alert('상품 추가 중 문제가 발생했습니다.');
  }
}


modalForm.addEventListener('submit', (e) => {
  e.preventDefault(); 
  addProduct(); 
});
