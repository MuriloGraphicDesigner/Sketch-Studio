(function () {
  'use strict';

  var data = window.STUDIO_DATA;
  var logic = window.SketchLogic;

  var state = {
    category: 'Todos',
    searchQuery: '',
    selectedProject: null,
    activeShowcaseFilter: 'Todas',
    lightbox: null, // { images: string[], currentIndex: number, caption: string }
    privacyOpen: false,
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function updateBodyScrollLock() {
    var locked = Boolean(state.selectedProject || state.privacyOpen || state.lightbox);
    document.body.style.overflow = locked ? 'hidden' : '';
  }

  /* ------------------------------------------------------------------------
     Theme Toggle (Light / Dark)
     ------------------------------------------------------------------------ */
  function initTheme() {
    var btn = document.getElementById('theme-toggle');
    function syncButtonLabel() {
      if (!btn) return;
      var isDark = document.documentElement.classList.contains('dark');
      btn.setAttribute('aria-label', isDark ? 'Ativar modo claro' : 'Ativar modo escuro');
    }
    syncButtonLabel();

    if (btn) {
      btn.addEventListener('click', function () {
        var nextDark = !document.documentElement.classList.contains('dark');
        document.documentElement.classList.toggle('dark', nextDark);
        try {
          localStorage.setItem('sketch_studio_theme', nextDark ? 'dark' : 'light');
        } catch (e) {}
        syncButtonLabel();
      });
    }
  }

  /* ------------------------------------------------------------------------
     Navigation, Mobile Drawer & Scroll Spy
     ------------------------------------------------------------------------ */
  function scrollToSection(sectionId) {
    var drawer = document.getElementById('mobile-menu-drawer');
    var menuBtn = document.getElementById('mobile-menu-btn');
    if (drawer && menuBtn) {
      drawer.hidden = true;
      menuBtn.setAttribute('aria-expanded', 'false');
    }

    var el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function initNavigation() {
    var drawer = document.getElementById('mobile-menu-drawer');
    var menuBtn = document.getElementById('mobile-menu-btn');

    if (menuBtn && drawer) {
      menuBtn.addEventListener('click', function () {
        var open = drawer.hidden;
        drawer.hidden = !open;
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      });
    }

    document.addEventListener('click', function (e) {
      var link = e.target.closest('[data-scroll-target]');
      if (link) {
        var target = link.getAttribute('data-scroll-target');
        if (target) {
          e.preventDefault();
          scrollToSection(target);
        }
      }
    });

    var navSections = ['inicio', 'portfolio', 'sobre', 'contato'];
    var navLinks = document.querySelectorAll('[data-nav-section]');

    function setActiveNav(id) {
      navLinks.forEach(function (el) {
        el.classList.toggle('is-active', el.getAttribute('data-nav-section') === id);
      });
    }

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              setActiveNav(entry.target.id);
            }
          });
        },
        { rootMargin: '-30% 0px -55% 0px', threshold: 0.05 }
      );
      navSections.forEach(function (id) {
        var sec = document.getElementById(id);
        if (sec) observer.observe(sec);
      });
    }
  }

  /* ------------------------------------------------------------------------
     Portfolio Rendering & Filtering
     ------------------------------------------------------------------------ */
  function renderFilterButtons() {
    var container = document.getElementById('portfolio-filters');
    if (!container) return;
    container.innerHTML = logic.PORTFOLIO_CATEGORIES.map(function (cat) {
      var activeClass = state.category === cat ? ' is-active' : '';
      return (
        '<button type="button" class="filter-btn' +
        activeClass +
        '" data-filter-category="' +
        escapeHtml(cat) +
        '">' +
        escapeHtml(cat) +
        '</button>'
      );
    }).join('');
  }

  function renderIllustrationCoverMosaic() {
    return (
      '<div class="illus-mosaic">' +
      '  <div class="illus-mosaic-grid">' +
      '    <div class="illus-cell illus-cell-dark">' +
      '      <img src="./assets/aistudio/image_3c892174.png" alt="Ilustração digital em estilo cel-shaded" loading="lazy" referrerpolicy="no-referrer" />' +
      '    </div>' +
      '    <div class="illus-mosaic-sub">' +
      '      <div class="illus-cell"><img src="./assets/aistudio/image_c3dcd73a.png" alt="Retrato digital estilizado" loading="lazy" referrerpolicy="no-referrer" /></div>' +
      '      <div class="illus-cell illus-cell-dark"><img src="./assets/aistudio/image_e44da5a2.png" alt="Ilustração digital com paleta pop vibrante" loading="lazy" referrerpolicy="no-referrer" /></div>' +
      '      <div class="illus-cell"><img src="./assets/aistudio/image_73ec1806.png" alt="Ilustração autoral em traço e terracota" loading="lazy" referrerpolicy="no-referrer" /></div>' +
      '      <div class="illus-cell"><img src="./assets/aistudio/image_27734cfc.png" alt="Ilustração de personagem estilo anime" loading="lazy" referrerpolicy="no-referrer" /></div>' +
      '    </div>' +
      '  </div>' +
      '</div>'
    );
  }

  function renderPortfolioGrid() {
    var grid = document.getElementById('portfolio-grid');
    var empty = document.getElementById('portfolio-empty');
    var countEl = document.getElementById('portfolio-count');
    if (!grid || !empty || !countEl) return;

    var filtered = logic.filterProjects(data.projects, state.category, state.searchQuery);
    countEl.textContent = filtered.length + (filtered.length === 1 ? ' projeto' : ' projetos');

    if (filtered.length === 0) {
      grid.innerHTML = '';
      empty.hidden = false;
      return;
    }

    empty.hidden = true;
    grid.innerHTML = filtered
      .map(function (project, index) {
        var slotClass =
          filtered.length === 1
            ? 'portfolio-slot-full'
            : index % 4 === 0 || index % 4 === 3
              ? 'portfolio-slot-wide'
              : 'portfolio-slot-compact';
        var media = logic.getProjectMediaPresentation(project);
        var isIllustration = project.category === 'Ilustração';

        var mediaMarkup =
          isIllustration && project.gallery.length >= 5
            ? renderIllustrationCoverMosaic()
            : '<div class="media-box ratio-16-10 ' +
              media.surfaceClass +
              '">' +
              '  <img src="' +
              escapeHtml(logic.resolveStudioAsset(project.coverImage)) +
              '" alt="' +
              escapeHtml(project.title) +
              '" loading="lazy" referrerpolicy="no-referrer" class="media-img fit-' +
              media.fit +
              (media.fit === 'contain' ? ' ' + media.containPaddingClass : '') +
              (media.objectPositionClass ? ' ' + media.objectPositionClass : '') +
              '" />' +
              '</div>';

        var footerLeftMarkup =
          project.palette.length > 0
            ? project.palette
                .slice(0, 4)
                .map(function (c) {
                  return (
                    '<span class="card-swatch-dot" style="background-color:' +
                    escapeHtml(c.hex) +
                    '" title="' +
                    escapeHtml(c.name + ' (' + c.hex + ')') +
                    '"></span>'
                  );
                })
                .join('')
            : '<span class="card-count-label">' + project.gallery.length + ' ilustrações</span>';

        return (
          '<div class="' +
          slotClass +
          '">' +
          '  <article class="project-card">' +
          '    <button type="button" class="card-cover-btn" data-open-project="' +
          escapeHtml(project.id) +
          '" aria-label="Abrir projeto ' +
          escapeHtml(project.title) +
          '">' +
          mediaMarkup +
          '    </button>' +
          '    <div class="card-body">' +
          '      <div>' +
          '        <div class="card-meta">' +
          '          <span class="card-cat">' +
          escapeHtml(project.category) +
          '</span>' +
          '          <span aria-hidden="true">·</span>' +
          '          <span>' +
          escapeHtml(project.year) +
          '</span>' +
          '          <span aria-hidden="true">·</span>' +
          '          <span>' +
          escapeHtml(project.client) +
          '</span>' +
          '        </div>' +
          '        <h3 class="card-title">' +
          '          <button type="button" class="card-title-btn" data-open-project="' +
          escapeHtml(project.id) +
          '">' +
          escapeHtml(project.title) +
          '</button>' +
          '        </h3>' +
          '      </div>' +
          '      <div class="card-footer">' +
          '        <div class="card-swatches">' +
          footerLeftMarkup +
          '</div>' +
          '        <button type="button" class="card-action-btn" data-open-project="' +
          escapeHtml(project.id) +
          '">' +
          '          <span>' +
          (isIllustration ? 'Ver galeria' : 'Ver projeto') +
          '</span>' +
          '          <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>' +
          '        </button>' +
          '      </div>' +
          '    </div>' +
          '  </article>' +
          '</div>'
        );
      })
      .join('');
  }

  function initPortfolio() {
    renderFilterButtons();
    renderPortfolioGrid();

    var filtersEl = document.getElementById('portfolio-filters');
    if (filtersEl) {
      filtersEl.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-filter-category]');
        if (!btn) return;
        state.category = btn.getAttribute('data-filter-category') || 'Todos';
        renderFilterButtons();
        renderPortfolioGrid();
      });
    }

    var searchInput = document.getElementById('portfolio-search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        state.searchQuery = searchInput.value;
        renderPortfolioGrid();
      });
    }

    var resetBtn = document.getElementById('portfolio-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        state.category = 'Todos';
        state.searchQuery = '';
        if (searchInput) searchInput.value = '';
        renderFilterButtons();
        renderPortfolioGrid();
      });
    }

    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-open-project]');
      if (!trigger) return;
      var id = trigger.getAttribute('data-open-project');
      var proj = data.projects.find(function (p) {
        return p.id === id;
      });
      if (proj) openProjectModal(proj);
    });
  }

  /* ------------------------------------------------------------------------
     Project Modal
     ------------------------------------------------------------------------ */
  function getAllProjectImages(project) {
    var isIllus = project.category === 'Ilustração';
    var showcaseImgs = (project.showcaseGroups || []).reduce(function (acc, g) {
      return acc.concat(
        g.items.map(function (i) {
          return i.src;
        })
      );
    }, []);
    var raw = isIllus
      ? project.gallery.concat([project.coverImage])
      : [project.coverImage].concat(project.gallery, showcaseImgs);
    var seen = {};
    return raw.filter(function (src) {
      if (!src || seen[src]) return false;
      seen[src] = true;
      return true;
    });
  }

  function renderProjectModal() {
    var modal = document.getElementById('project-modal');
    var body = document.getElementById('project-modal-body');
    if (!modal || !body) return;

    if (!state.selectedProject) {
      modal.hidden = true;
      body.innerHTML = '';
      updateBodyScrollLock();
      return;
    }

    var project = state.selectedProject;
    var projects = data.projects;
    var currentIdx = projects.findIndex(function (p) {
      return p.id === project.id;
    });
    var prev = projects.length > 1 ? projects[(currentIdx - 1 + projects.length) % projects.length] : null;
    var next = projects.length > 1 ? projects[(currentIdx + 1) % projects.length] : null;

    var isIllus = project.category === 'Ilustração';
    var allImages = getAllProjectImages(project);
    var coverMedia = logic.getProjectMediaPresentation(project);

    var headerHtml =
      '<div class="modal-top-bar">' +
      '  <div class="card-meta">' +
      '    <span class="card-cat">' +
      escapeHtml(project.category) +
      '</span>' +
      '    <span aria-hidden="true">·</span>' +
      '    <span>' +
      escapeHtml(project.year) +
      '</span>' +
      '    <span aria-hidden="true">·</span>' +
      '    <span>' +
      escapeHtml(project.client) +
      '</span>' +
      '  </div>' +
      '  <button type="button" class="modal-close-btn" data-close-project aria-label="Fechar projeto">' +
      '    <svg class="icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
      '  </button>' +
      '</div>' +
      '<div class="project-modal-header">' +
      '  <div><h2 class="project-modal-title">' +
      escapeHtml(project.title) +
      '</h2></div>' +
      '  <div class="project-modal-actions">' +
      (project.behanceUrl
        ? '<a href="' +
          escapeHtml(project.behanceUrl) +
          '" target="_blank" rel="noopener noreferrer" class="btn btn-outline">' +
          '<span>Ver no Behance</span></a>'
        : '') +
      (project.presentationPdfUrl
        ? '<a href="' +
          escapeHtml(project.presentationPdfUrl) +
          '" target="_blank" rel="noopener noreferrer" class="btn btn-primary">' +
          '<span>' +
          escapeHtml(project.presentationPdfLabel || 'Abrir Apresentação (PDF)') +
          '</span></a>'
        : '') +
      '    <button type="button" class="btn btn-primary" data-request-similar="' +
      escapeHtml(project.category) +
      '">' +
      '      <span>Solicitar projeto semelhante</span>' +
      '      <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>' +
      '    </button>' +
      '  </div>' +
      '</div>';

    var coverHtml = !isIllus
      ? '<div class="modal-cover-wrap">' +
        '  <button type="button" class="modal-cover-btn" data-open-lightbox="0" aria-label="Ampliar capa do projeto ' +
        escapeHtml(project.title) +
        '">' +
        '    <div class="media-box ' +
        (project.galleryAspect === 'square' ? 'ratio-16-10' : 'ratio-16-9') +
        ' ' +
        coverMedia.surfaceClass +
        '">' +
        '      <img src="' +
        escapeHtml(logic.resolveStudioAsset(project.coverImage)) +
        '" alt="' +
        escapeHtml(project.title) +
        '" class="media-img fit-' +
        coverMedia.fit +
        (coverMedia.fit === 'contain' ? ' ' + coverMedia.containPaddingClass : '') +
        '" />' +
        '    </div>' +
        '    <span class="zoom-badge">Ampliar imagem</span>' +
        '  </button>' +
        '</div>'
      : '';

    var detailsHtml = '';
    if (!isIllus && (project.summary || project.palette.length > 0)) {
      detailsHtml = '<section class="modal-details-grid">';
      if (project.summary) {
        detailsHtml +=
          '<div>' +
          '  <h3 class="modal-section-heading">Descrição do projeto</h3>' +
          '  <p class="modal-summary-text">' +
          escapeHtml(project.summary) +
          '</p>' +
          '</div>';
      }
      if (project.palette.length > 0) {
        detailsHtml +=
          '<aside class="palette-aside">' +
          '  <h4 class="palette-aside-title">Paleta de cores</h4>' +
          '  <div class="palette-grid">' +
          project.palette
            .map(function (c) {
              return (
                '<button type="button" class="palette-btn" data-modal-copy-hex="' +
                escapeHtml(c.hex) +
                '">' +
                '  <span class="palette-chip" style="background-color:' +
                escapeHtml(c.hex) +
                '"></span>' +
                '  <span class="palette-info">' +
                '    <span class="palette-name" style="display:block">' +
                escapeHtml(c.name) +
                '</span>' +
                '    <span class="palette-hex" style="display:block">' +
                escapeHtml(c.hex) +
                '</span>' +
                '  </span>' +
                '</button>'
              );
            })
            .join('') +
          '  </div>' +
          '</aside>';
      }
      detailsHtml += '</section>';
    }

    var showcaseHtml = '';
    if (project.showcaseGroups && project.showcaseGroups.length > 0) {
      var filterOptions = ['Todas'];
      project.showcaseGroups.forEach(function (g) {
        if (g.filterCategory && filterOptions.indexOf(g.filterCategory) === -1) {
          filterOptions.push(g.filterCategory);
        }
      });

      var visibleGroups =
        state.activeShowcaseFilter === 'Todas'
          ? project.showcaseGroups
          : project.showcaseGroups.filter(function (g) {
              return g.filterCategory === state.activeShowcaseFilter;
            });

      showcaseHtml =
        '<section class="showcase-section">' +
        '  <div class="showcase-header">' +
        '    <div>' +
        '      <p class="eyebrow">Sistema visual organizado</p>' +
        '      <h3 class="modal-section-heading">Variações oficiais, assinaturas e aplicações cromáticas</h3>' +
        '    </div>' +
        '    <div class="filter-group" role="group" aria-label="Filtrar variações de identidade visual">' +
        filterOptions
          .map(function (opt) {
            return (
              '<button type="button" class="filter-btn' +
              (state.activeShowcaseFilter === opt ? ' is-active' : '') +
              '" data-showcase-filter="' +
              escapeHtml(opt) +
              '">' +
              escapeHtml(opt) +
              '</button>'
            );
          })
          .join('') +
        '    </div>' +
        '  </div>' +
        '  <div class="showcase-groups-list">' +
        visibleGroups
          .map(function (group) {
            var gridClass = group.columns === 5 ? 'variations-grid-5' : 'variations-grid-4';
            var ratioClass = group.tileAspect === 'wide' ? 'ratio-16-10' : 'ratio-square';
            var padClass = group.tileAspect === 'wide' ? 'pad-md' : 'pad-lg';

            return (
              '<div class="showcase-group-card">' +
              '  <div class="showcase-group-head">' +
              '    <div>' +
              '      <h4 class="showcase-group-title">' +
              escapeHtml(group.title) +
              '</h4>' +
              '      <p class="showcase-group-sub">' +
              escapeHtml(group.subtitle) +
              '</p>' +
              '    </div>' +
              '    <span class="project-count">' +
              group.items.length +
              (group.items.length === 1 ? ' variação' : ' variações') +
              '</span>' +
              '  </div>' +
              '  <div class="' +
              gridClass +
              '">' +
              group.items
                .map(function (item) {
                  var lbIdx = Math.max(0, allImages.indexOf(item.src));
                  var surfaceClass = logic.getShowcaseSurfaceClass(item.surface);
                  var isDarkTile = item.surface !== 'light';
                  var hint =
                    item.surface === 'bordeaux'
                      ? 'Fundo bordô'
                      : item.surface === 'dark'
                        ? 'Fundo escuro'
                        : 'Fundo claro';

                  return (
                    '<button type="button" class="variation-tile" data-open-lightbox="' +
                    lbIdx +
                    '" data-lightbox-title="' +
                    escapeHtml(project.title + ' — ' + item.label) +
                    '">' +
                    '  <div class="media-box ' +
                    ratioClass +
                    ' ' +
                    surfaceClass +
                    '">' +
                    '    <img src="' +
                    escapeHtml(logic.resolveStudioAsset(item.src)) +
                    '" alt="' +
                    escapeHtml(group.title + ' — ' + item.label) +
                    '" loading="lazy" referrerpolicy="no-referrer" class="media-img fit-contain ' +
                    padClass +
                    '" />' +
                    '  </div>' +
                    '  <div class="variation-caption' +
                    (isDarkTile ? ' variation-caption-dark' : '') +
                    '">' +
                    '    <span class="variation-label">' +
                    escapeHtml(item.label) +
                    '</span>' +
                    '    <span class="variation-surface">' +
                    hint +
                    '</span>' +
                    '  </div>' +
                    '</button>'
                  );
                })
                .join('') +
              '  </div>' +
              '</div>'
            );
          })
          .join('') +
        '  </div>' +
        '</section>';
    }

    var galleryHtml = '';
    if (allImages.length > 0 && (!project.showcaseGroups || project.showcaseGroups.length === 0)) {
      var gridClass = isIllus ? 'gallery-grid-illus' : 'gallery-grid';
      var isCutFilmes = project.slug === 'cut-filmes-identidade-visual';

      galleryHtml =
        '<section class="gallery-section">' +
        '  <h3 class="modal-section-heading">' +
        (isIllus ? 'Galeria de ilustrações' : 'Galeria de aplicações e mockups') +
        '</h3>' +
        '  <p class="gallery-sub">' +
        (isIllus
          ? allImages.length + ' ilustrações · Clique em qualquer imagem para ampliar.'
          : 'Clique em qualquer imagem para ampliar.') +
        '</p>' +
        '  <div class="' +
        gridClass +
        '">' +
        allImages
          .map(function (img, idx) {
            var itemMedia = logic.getProjectMediaPresentation(project, img);
            var isCutWide =
              isCutFilmes &&
              (img.indexOf('cut_films.png') !== -1 ||
                img.indexOf('image_673e4dc1.png') !== -1 ||
                img.indexOf('image_340dec8b.png') !== -1);
            var isAdventureWide =
              project.galleryAspect === 'square' &&
              (img.indexOf('image_5f6b6b16.png') !== -1 ||
                img.indexOf('image_199994aa.png') !== -1);

            var ratioClass = isCutWide
              ? 'ratio-16-9'
              : isCutFilmes
                ? 'ratio-square'
                : project.galleryAspect === '16/9' || isAdventureWide
                  ? 'ratio-16-9'
                  : project.galleryAspect === 'square'
                    ? 'ratio-square'
                    : isIllus
                      ? 'ratio-4-5'
                      : 'ratio-16-10';

            var fit = isCutFilmes ? 'contain' : itemMedia.fit;
            var surface = isCutFilmes ? 'surface-cinema' : itemMedia.surfaceClass;
            var pad = isCutWide ? 'pad-none' : isCutFilmes ? 'pad-sm' : itemMedia.containPaddingClass;

            return (
              '<button type="button" class="gallery-tile' +
              (isCutWide || isAdventureWide ? ' gallery-tile-wide' : '') +
              '" data-open-lightbox="' +
              idx +
              '">' +
              '  <div class="media-box ' +
              ratioClass +
              ' ' +
              surface +
              '">' +
              '    <img src="' +
              escapeHtml(logic.resolveStudioAsset(img)) +
              '" alt="' +
              escapeHtml(project.title + ' — imagem ' + (idx + 1)) +
              '" loading="lazy" referrerpolicy="no-referrer" class="media-img fit-' +
              fit +
              (fit === 'contain' ? ' ' + pad : '') +
              (itemMedia.objectPositionClass ? ' ' + itemMedia.objectPositionClass : '') +
              '" />' +
              '  </div>' +
              '</button>'
            );
          })
          .join('') +
        '  </div>' +
        '</section>';
    }

    var navHtml =
      '<nav class="modal-nav-footer" aria-label="Navegação entre projetos">' +
      (prev
        ? '<button type="button" class="modal-nav-btn" data-switch-project="' +
          escapeHtml(prev.id) +
          '">' +
          '  <span class="modal-nav-kicker">← Projeto anterior</span>' +
          '  <span class="modal-nav-title">' +
          escapeHtml(prev.title) +
          '</span>' +
          '</button>'
        : '<div></div>') +
      (next
        ? '<button type="button" class="modal-nav-btn modal-nav-next" data-switch-project="' +
          escapeHtml(next.id) +
          '">' +
          '  <span class="modal-nav-kicker">Próximo projeto →</span>' +
          '  <span class="modal-nav-title">' +
          escapeHtml(next.title) +
          '</span>' +
          '</button>'
        : '') +
      '</nav>';

    body.innerHTML = headerHtml + coverHtml + detailsHtml + showcaseHtml + galleryHtml + navHtml;
    modal.setAttribute('aria-label', 'Projeto ' + project.title);
    modal.hidden = false;
    modal.scrollTop = 0;
    updateBodyScrollLock();
  }

  function openProjectModal(project) {
    state.selectedProject = project;
    state.activeShowcaseFilter = 'Todas';
    renderProjectModal();
  }

  function closeProjectModal() {
    state.selectedProject = null;
    renderProjectModal();
  }

  function initProjectModal() {
    var modal = document.getElementById('project-modal');
    if (!modal) return;

    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.closest('[data-close-project]')) {
        closeProjectModal();
        return;
      }

      var switchBtn = e.target.closest('[data-switch-project]');
      if (switchBtn) {
        var targetId = switchBtn.getAttribute('data-switch-project');
        var nextProj = data.projects.find(function (p) {
          return p.id === targetId;
        });
        if (nextProj) openProjectModal(nextProj);
        return;
      }

      var filterBtn = e.target.closest('[data-showcase-filter]');
      if (filterBtn) {
        state.activeShowcaseFilter = filterBtn.getAttribute('data-showcase-filter') || 'Todas';
        renderProjectModal();
        return;
      }

      var copyBtn = e.target.closest('[data-modal-copy-hex]');
      if (copyBtn) {
        var hex = copyBtn.getAttribute('data-modal-copy-hex');
        var hexEl = copyBtn.querySelector('.palette-hex');
        if (hex && hexEl && navigator.clipboard) {
          navigator.clipboard.writeText(hex).then(function () {
            hexEl.textContent = 'Copiado!';
            setTimeout(function () {
              hexEl.textContent = hex;
            }, 1400);
          }).catch(function () {});
        }
        return;
      }

      var reqBtn = e.target.closest('[data-request-similar]');
      if (reqBtn) {
        closeProjectModal();
        scrollToSection('contato');
        return;
      }

      var lbBtn = e.target.closest('[data-open-lightbox]');
      if (lbBtn && state.selectedProject) {
        var idx = parseInt(lbBtn.getAttribute('data-open-lightbox') || '0', 10) || 0;
        var caption = lbBtn.getAttribute('data-lightbox-title') || state.selectedProject.title;
        openLightbox(getAllProjectImages(state.selectedProject), idx, caption);
      }
    });
  }

  /* ------------------------------------------------------------------------
     Lightbox Modal
     ------------------------------------------------------------------------ */
  function renderLightbox() {
    var modal = document.getElementById('lightbox-modal');
    var img = document.getElementById('lightbox-image');
    var caption = document.getElementById('lightbox-caption');
    var prevBtn = document.getElementById('lightbox-prev-btn');
    var nextBtn = document.getElementById('lightbox-next-btn');
    if (!modal || !img || !caption) return;

    if (!state.lightbox) {
      modal.hidden = true;
      updateBodyScrollLock();
      return;
    }

    var lb = state.lightbox;
    var total = lb.images.length;
    img.src = logic.resolveStudioAsset(lb.images[lb.currentIndex]);
    img.alt = lb.caption || 'Imagem ampliada do portfólio Sketch Studio';
    caption.textContent = (lb.caption || 'Visualização de projeto') + ' · ' + (lb.currentIndex + 1) + ' / ' + total;
    if (prevBtn) prevBtn.hidden = total <= 1;
    if (nextBtn) nextBtn.hidden = total <= 1;
    modal.hidden = false;
    updateBodyScrollLock();
  }

  function openLightbox(images, index, caption) {
    state.lightbox = {
      images: images,
      currentIndex: Math.max(0, Math.min(index, images.length - 1)),
      caption: caption || '',
    };
    renderLightbox();
  }

  function closeLightbox() {
    state.lightbox = null;
    renderLightbox();
  }

  function initLightbox() {
    var modal = document.getElementById('lightbox-modal');
    var closeBtn = document.getElementById('lightbox-close-btn');
    var prevBtn = document.getElementById('lightbox-prev-btn');
    var nextBtn = document.getElementById('lightbox-next-btn');

    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeLightbox();
      });
    }
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        if (!state.lightbox) return;
        var n = state.lightbox.images.length;
        state.lightbox.currentIndex = (state.lightbox.currentIndex - 1 + n) % n;
        renderLightbox();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (!state.lightbox) return;
        var n = state.lightbox.images.length;
        state.lightbox.currentIndex = (state.lightbox.currentIndex + 1) % n;
        renderLightbox();
      });
    }
  }

  /* ------------------------------------------------------------------------
     Privacy Modal & Global Escape Key
     ------------------------------------------------------------------------ */
  function initPrivacyModal() {
    var modal = document.getElementById('privacy-modal');
    var closeBtn = document.getElementById('privacy-close-btn');
    var acceptBtn = document.getElementById('privacy-accept-btn');

    function setPrivacyOpen(open) {
      state.privacyOpen = open;
      if (modal) modal.hidden = !open;
      updateBodyScrollLock();
    }

    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-open-privacy]')) {
        setPrivacyOpen(true);
      }
    });
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) setPrivacyOpen(false);
      });
    }
    if (closeBtn) closeBtn.addEventListener('click', function () { setPrivacyOpen(false); });
    if (acceptBtn) acceptBtn.addEventListener('click', function () { setPrivacyOpen(false); });

    window.addEventListener('keydown', function (e) {
      if (state.lightbox) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight' && state.lightbox.images.length > 1) {
          state.lightbox.currentIndex = (state.lightbox.currentIndex + 1) % state.lightbox.images.length;
          renderLightbox();
        }
        if (e.key === 'ArrowLeft' && state.lightbox.images.length > 1) {
          state.lightbox.currentIndex =
            (state.lightbox.currentIndex - 1 + state.lightbox.images.length) % state.lightbox.images.length;
          renderLightbox();
        }
        return;
      }
      if (e.key === 'Escape') {
        if (state.privacyOpen) {
          setPrivacyOpen(false);
        } else if (state.selectedProject) {
          closeProjectModal();
        }
      }
    });
  }

  /* ------------------------------------------------------------------------
     Bootstrap
     ------------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', function () {
    var yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    initTheme();
    initNavigation();
    initPortfolio();
    initProjectModal();
    initLightbox();
    initPrivacyModal();
  });
})();
