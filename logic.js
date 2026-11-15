(function (root) {
  'use strict';

  var PORTFOLIO_CATEGORIES = [
    'Todos',
    'Branding',
    'Identidade visual',
    'Design gráfico',
    'Editorial',
    'Ilustração',
  ];

  var SURFACE_CLASS_MAP = {
    dark: 'surface-dark',
    light: 'surface-light',
    bordeaux: 'surface-bordeaux',
    taupe: 'surface-taupe',
  };

  var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

  function resolveStudioAsset(src) {
    if (!src) return './assets/aistudio/Logo_Princiapl_dd8b985e.png';
    if (src.indexOf('/assets/') === 0) return '.' + src;
    return src;
  }

  function filterProjects(projects, category, searchQuery) {
    var q = (searchQuery || '').trim().toLowerCase();
    return projects.filter(function (project) {
      var matchesCategory = category === 'Todos' || project.category === category;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        project.title.toLowerCase().indexOf(q) !== -1 ||
        project.category.toLowerCase().indexOf(q) !== -1 ||
        project.client.toLowerCase().indexOf(q) !== -1
      );
    });
  }

  function getShowcaseSurfaceClass(surface) {
    return SURFACE_CLASS_MAP[surface] || 'surface-light';
  }

  function getProjectMediaPresentation(project, imageSrc) {
    var src = String(imageSrc || project.coverImage || '').toLowerCase();
    if (project.coverFit === 'cover' && src.indexOf('ativo_') === -1) {
      return {
        fit: 'cover',
        surfaceClass: project.coverSurface
          ? getShowcaseSurfaceClass(project.coverSurface)
          : 'surface-warm',
        containPaddingClass: 'pad-sm',
      };
    }
    if (project.category === 'Ilustração') {
      return {
        fit: 'cover',
        surfaceClass: 'surface-cream',
        containPaddingClass: 'pad-none',
        objectPositionClass: 'pos-portrait',
      };
    }
    if (
      project.coverFit === 'contain' ||
      project.coverSurface ||
      src.slice(-4) === '.png'
    ) {
      var surface = project.coverSurface || 'light';
      var isTransparentLogo =
        src.indexOf('ativo_') !== -1 || src.indexOf('/assets/aistudio/') !== -1;
      return {
        fit: 'contain',
        surfaceClass: getShowcaseSurfaceClass(surface),
        containPaddingClass: isTransparentLogo ? 'pad-lg' : 'pad-md',
      };
    }
    return {
      fit: 'cover',
      surfaceClass: 'surface-warm',
      containPaddingClass: 'pad-sm',
    };
  }

  function normalizeDigits(raw) {
    return String(raw || '').replace(/\D+/g, '');
  }

  function isValidWhatsAppPhone(raw) {
    var digits = normalizeDigits(raw);
    return digits.length >= 10 && digits.length <= 15;
  }

  function isValidHexColor(hex) {
    return HEX_COLOR_REGEX.test(String(hex || '').trim());
  }

  function slugify(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function validateQuoteInput(input) {
    var errors = {};
    if (!input.nome || input.nome.trim().length < 2) {
      errors.nome = 'Informe seu nome completo (mínimo 2 caracteres).';
    }
    if (!input.email || !EMAIL_REGEX.test(input.email.trim())) {
      errors.email = 'Informe um endereço de e-mail válido.';
    }
    if (!input.whatsapp || !isValidWhatsAppPhone(input.whatsapp)) {
      errors.whatsapp = 'Informe um número de WhatsApp válido com DDD (10 a 15 dígitos).';
    }
    if (!input.empresa || input.empresa.trim().length < 2) {
      errors.empresa = 'Informe o nome da sua empresa, marca ou projeto.';
    }
    if (!input.servico || input.servico.trim().length === 0) {
      errors.servico = 'Selecione o tipo de serviço desejado.';
    }
    if (!input.descricao || input.descricao.trim().length < 20) {
      errors.descricao =
        'Descreva brevemente o contexto e objetivos do projeto (mínimo 20 caracteres).';
    }
    if (!input.prazo || input.prazo.trim().length === 0) {
      errors.prazo = 'Selecione ou informe o prazo desejado.';
    }
    if (!input.investimento || input.investimento.trim().length === 0) {
      errors.investimento = 'Selecione a faixa de investimento prevista.';
    }
    if (!input.lgpdConsent) {
      errors.lgpdConsent =
        'É necessário aceitar a Política de Privacidade (LGPD) para enviar a solicitação.';
    }
    return {
      valid: Object.keys(errors).length === 0,
      errors: errors,
    };
  }

  function validateContactInput(input) {
    var errors = {};
    if (!input.nome || input.nome.trim().length < 2) {
      errors.nome = 'Informe seu nome.';
    }
    if (!input.email || !EMAIL_REGEX.test(input.email.trim())) {
      errors.email = 'Informe um e-mail válido.';
    }
    if (!input.assunto || input.assunto.trim().length < 3) {
      errors.assunto = 'Informe o assunto da mensagem.';
    }
    if (!input.mensagem || input.mensagem.trim().length < 10) {
      errors.mensagem = 'Escreva sua mensagem com pelo menos 10 caracteres.';
    }
    if (!input.lgpdConsent) {
      errors.lgpdConsent = 'Confirme o consentimento com a Política de Privacidade (LGPD).';
    }
    return {
      valid: Object.keys(errors).length === 0,
      errors: errors,
    };
  }

  function buildWhatsAppUrl(phoneRaw, message) {
    var digits = normalizeDigits(phoneRaw);
    if (digits.length < 10) {
      return null;
    }
    var international =
      digits.length === 10 || digits.length === 11 ? '55' + digits : digits;
    return 'https://wa.me/' + international + '?text=' + encodeURIComponent(message || '');
  }

  var api = {
    PORTFOLIO_CATEGORIES: PORTFOLIO_CATEGORIES,
    resolveStudioAsset: resolveStudioAsset,
    filterProjects: filterProjects,
    getShowcaseSurfaceClass: getShowcaseSurfaceClass,
    getProjectMediaPresentation: getProjectMediaPresentation,
    normalizeDigits: normalizeDigits,
    isValidWhatsAppPhone: isValidWhatsAppPhone,
    isValidHexColor: isValidHexColor,
    slugify: slugify,
    validateQuoteInput: validateQuoteInput,
    validateContactInput: validateContactInput,
    buildWhatsAppUrl: buildWhatsAppUrl,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.SketchLogic = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
