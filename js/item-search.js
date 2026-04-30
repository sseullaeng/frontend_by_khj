class ItemSearchApp {
    constructor() {
        this.items = [];
        this.filteredItems = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.searchQuery = '';
        this.selectedCategory = 'all';
        this.selectedType = 'all';
        this.sortBy = 'recent';

        this.init();
    }

    init() {
        this.items = this.getMockItems();
        this.filteredItems = [...this.items];
        this.bindEvents();
        this.render();
    }

    getMockItems() {
        return [
            {
                id: 1,
                title: '에어팟 프로 2세대',
                price: 180000,
                rentalPrice: 9000,
                itemType: 'SELL',
                category: 'electronics',
                location: '서울',
                image: null,
                hashtags: ['애플', '에어팟', '이어폰'],
                postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 730),
                wishCount: 34
            },
            {
                id: 2,
                title: '맥북 프로 M2 14인치',
                price: 1650000,
                rentalPrice: null,
                itemType: 'SELL',
                category: 'electronics',
                location: '서울 강남구',
                image: null,
                hashtags: ['애플', '맥북', '노트북'],
                postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
                wishCount: 21
            },
            {
                id: 3,
                title: '캐논 EOS R50 카메라',
                price: null,
                rentalPrice: 25000,
                itemType: 'RENT',
                category: 'electronics',
                location: '경기 성남',
                image: null,
                hashtags: ['카메라', '캐논', '미러리스'],
                postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
                wishCount: 57
            },
            {
                id: 4,
                title: '개발 서적 모음 (10권)',
                price: 0,
                rentalPrice: null,
                itemType: 'SHARE',
                category: 'books',
                location: '인천 남동구',
                image: null,
                hashtags: ['도서', '개발', 'IT'],
                postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
                wishCount: 89
            },
            {
                id: 5,
                title: '나이키 패딩 점퍼 M사이즈',
                price: 45000,
                rentalPrice: null,
                itemType: 'SELL',
                category: 'clothing',
                location: '서울 마포구',
                image: null,
                hashtags: ['의류', '나이키', '패딩'],
                postedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
                wishCount: 12
            },
            {
                id: 6,
                title: '캡슐 커피머신 네스프레소',
                price: 55000,
                rentalPrice: 5000,
                itemType: 'SELL',
                category: 'household',
                location: '부산 해운대',
                image: null,
                hashtags: ['가전', '커피', '네스프레소'],
                postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
                wishCount: 8
            },
            {
                id: 7,
                title: '아이패드 프로 12.9인치 (5세대)',
                price: 780000,
                rentalPrice: null,
                itemType: 'SELL',
                category: 'electronics',
                location: '서울 송파구',
                image: null,
                hashtags: ['애플', '아이패드', '태블릿'],
                postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
                wishCount: 44
            },
            {
                id: 8,
                title: '캠핑 텐트 4인용',
                price: null,
                rentalPrice: 18000,
                itemType: 'RENT',
                category: 'sports',
                location: '경기 용인',
                image: null,
                hashtags: ['캠핑', '텐트', '야외'],
                postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
                wishCount: 33
            },
            {
                id: 9,
                title: '삼성 갤럭시 S23 울트라',
                price: 650000,
                rentalPrice: 20000,
                itemType: 'SELL',
                category: 'electronics',
                location: '대구 수성구',
                image: null,
                hashtags: ['삼성', '갤럭시', '스마트폰'],
                postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
                wishCount: 29
            },
            {
                id: 10,
                title: '원목 6인용 식탁 세트',
                price: 280000,
                rentalPrice: null,
                itemType: 'SELL',
                category: 'furniture',
                location: '서울 노원구',
                image: null,
                hashtags: ['가구', '원목', '식탁'],
                postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
                wishCount: 16
            },
            {
                id: 11,
                title: '요가 매트 + 블록 세트',
                price: 15000,
                rentalPrice: null,
                itemType: 'SELL',
                category: 'sports',
                location: '서울 은평구',
                image: null,
                hashtags: ['요가', '운동', '홈트'],
                postedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
                wishCount: 7
            },
            {
                id: 12,
                title: '아동 도서 50권 나눔',
                price: 0,
                rentalPrice: null,
                itemType: 'SHARE',
                category: 'books',
                location: '경기 고양',
                image: null,
                hashtags: ['도서', '아동', '나눔'],
                postedAt: new Date(Date.now() - 1000 * 60 * 30),
                wishCount: 61
            }
        ];
    }

    bindEvents() {
        // 검색
        const searchInput = document.querySelector('.search-input');
        const searchBtn = document.querySelector('.search-btn');
        searchInput.addEventListener('input', this.debounce(() => {
            this.searchQuery = searchInput.value.toLowerCase().trim();
            this.applyFilters();
        }, 300));
        searchBtn.addEventListener('click', () => {
            this.searchQuery = searchInput.value.toLowerCase().trim();
            this.applyFilters();
        });
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchQuery = searchInput.value.toLowerCase().trim();
                this.applyFilters();
            }
        });

        // 카테고리 필터 칩
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.selectedCategory = chip.dataset.category;
                this.applyFilters();
            });
        });

        // 거래유형 탭
        document.querySelectorAll('.type-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.selectedType = tab.dataset.type;
                this.applyFilters();
            });
        });

        // 정렬
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.applyFilters();
        });
    }

    applyFilters() {
        this.filteredItems = this.items.filter(item => {
            const matchesSearch = !this.searchQuery ||
                item.title.toLowerCase().includes(this.searchQuery) ||
                item.hashtags.some(tag => tag.toLowerCase().includes(this.searchQuery));
            const matchesCategory = this.selectedCategory === 'all' || item.category === this.selectedCategory;
            const matchesType = this.selectedType === 'all' || item.itemType === this.selectedType;
            return matchesSearch && matchesCategory && matchesType;
        });

        this.applySorting();
        this.currentPage = 1;
        this.render();
    }

    applySorting() {
        switch (this.sortBy) {
            case 'recent':
                this.filteredItems.sort((a, b) => b.postedAt - a.postedAt);
                break;
            case 'price-low':
                this.filteredItems.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
                break;
            case 'price-high':
                this.filteredItems.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
                break;
            case 'popular':
                this.filteredItems.sort((a, b) => b.wishCount - a.wishCount);
                break;
        }
    }

    render() {
        document.getElementById('totalCount').textContent = this.filteredItems.length;

        const grid = document.getElementById('itemsGrid');
        if (this.filteredItems.length === 0) {
            grid.innerHTML = `
                <div class="no-results">
                    <h3>검색 결과가 없어요</h3>
                    <p>검색어나 필터를 변경해 보세요.</p>
                    <button onclick="app.clearFilters()">필터 초기화</button>
                </div>`;
            document.getElementById('pagination').innerHTML = '';
            return;
        }

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const pageItems = this.filteredItems.slice(start, start + this.itemsPerPage);
        grid.innerHTML = pageItems.map(item => this.renderCard(item)).join('');
        this.renderPagination();
    }

    renderCard(item) {
        const badgeClass = item.itemType === 'SELL' ? 'badge-junggo' :
                           item.itemType === 'RENT' ? 'badge-daeyeo' : 'badge-nanum';
        const badgeLabel = item.itemType === 'SELL' ? '중고거래' :
                           item.itemType === 'RENT' ? '대여' : '나눔';

        let priceHtml = '';
        if (item.itemType === 'SHARE') {
            priceHtml = `<div class="card-price-nanum">무료 나눔</div>`;
        } else if (item.itemType === 'RENT') {
            priceHtml = `<div class="card-price-daeyeo"><span>대여</span>${item.rentalPrice.toLocaleString()}원/일</div>`;
        } else {
            priceHtml = `<div class="card-price-junggo"><span>중고</span>${item.price.toLocaleString()}원</div>`;
            if (item.rentalPrice) {
                priceHtml += `<div class="card-price-daeyeo"><span>대여</span>${item.rentalPrice.toLocaleString()}원/일</div>`;
            }
        }

        const tagsHtml = item.hashtags.map(t => `<span class="card-tag">#${t}</span>`).join('');
        const imageHtml = item.image
            ? `<img src="${item.image}" alt="${item.title}">`
            : `<div class="card-image-placeholder"></div>`;

        return `
            <div class="product-card" data-item-id="${item.id}">
                <div class="card-image-wrap">
                    ${imageHtml}
                    <span class="card-badge ${badgeClass}">${badgeLabel}</span>
                    <button class="card-heart">🤍</button>
                </div>
                <div class="card-body">
                    <div class="card-title">${item.title}</div>
                    ${priceHtml}
                    <div class="card-tags">${tagsHtml}</div>
                    <div class="card-footer">
                        <div class="card-location">📍 ${item.location}</div>
                        <div class="card-meta">
                            <span>🤍 ${item.wishCount}</span>
                            <span>${this.getTimeAgo(item.postedAt)}</span>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);
        const container = document.getElementById('pagination');

        if (totalPages <= 1) { container.innerHTML = ''; return; }

        const pages = this.getPageNumbers(totalPages);
        container.innerHTML = `
            <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''}
                    onclick="app.goToPage(${this.currentPage - 1})">이전</button>
            <div style="display:flex;gap:6px;">
                ${pages.map(p => p === '...'
                    ? `<span class="pagination-ellipsis">...</span>`
                    : `<button class="pagination-number ${p === this.currentPage ? 'active' : ''}"
                               onclick="app.goToPage(${p})">${p}</button>`
                ).join('')}
            </div>
            <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''}
                    onclick="app.goToPage(${this.currentPage + 1})">다음</button>`;
    }

    getPageNumbers(totalPages) {
        const pages = [];
        const maxVisible = 5;
        const start = Math.max(1, this.currentPage - 2);
        const end = Math.min(totalPages, start + maxVisible - 1);

        if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
        for (let i = start; i <= end; i++) pages.push(i);
        if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }

        return pages;
    }

    goToPage(page) {
        this.currentPage = page;
        this.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    clearFilters() {
        document.querySelector('.search-input').value = '';
        document.querySelectorAll('.filter-chip').forEach((c, i) => c.classList.toggle('active', i === 0));
        document.querySelectorAll('.type-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
        document.getElementById('sortSelect').value = 'recent';

        this.searchQuery = '';
        this.selectedCategory = 'all';
        this.selectedType = 'all';
        this.sortBy = 'recent';
        this.applyFilters();
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        const interval = [
            [31536000, '년'],
            [2592000, '달'],
            [86400, '일'],
            [3600, '시간'],
            [60, '분'],
        ];
        for (const [sec, unit] of interval) {
            const v = Math.floor(seconds / sec);
            if (v >= 1) return `약 ${v}${unit} 전`;
        }
        return '방금 전';
    }

    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }
}

document.addEventListener('DOMContentLoaded', () => { window.app = new ItemSearchApp(); });
