import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const logic = require('./logic.js');

const sampleProjects = [
  {
    id: '1',
    slug: 'projeto-1',
    title: 'Sistema Botânico',
    client: 'Cliente Alfa',
    category: 'Branding',
    year: '2026',
    summary: '',
    palette: [],
    coverImage: './img1.jpg',
    gallery: [],
  },
  {
    id: '2',
    slug: 'projeto-2',
    title: 'Monografia Editorial',
    client: 'Cliente Beta',
    category: 'Editorial',
    year: '2026',
    summary: '',
    palette: [],
    coverImage: './img2.jpg',
    gallery: [],
  },
  {
    id: '3',
    slug: 'projeto-3',
    title: 'Caderno de Marca',
    client: 'Cliente Gama',
    category: 'Branding',
    year: '2026',
    summary: '',
    palette: [],
    coverImage: './img3.jpg',
    gallery: [],
  },
];

test('filterProjects filters by category and search query', () => {
  assert.equal(logic.filterProjects(sampleProjects, 'Todos').length, 3);
  assert.equal(logic.filterProjects(sampleProjects, 'Branding').length, 2);
  assert.equal(logic.filterProjects(sampleProjects, 'Editorial').length, 1);
  assert.equal(logic.filterProjects(sampleProjects, 'Todos', 'Monografia').length, 1);
  assert.equal(logic.filterProjects(sampleProjects, 'Branding', 'Monografia').length, 0);
});

test('getProjectMediaPresentation frames illustrations and logos properly', () => {
  const illus = logic.getProjectMediaPresentation({
    category: 'Ilustração',
    coverImage: './assets/aistudio/image_c3dcd73a.png',
  });
  assert.equal(illus.fit, 'cover');
  assert.equal(illus.objectPositionClass, 'pos-portrait');

  const lawLogo = logic.getProjectMediaPresentation({
    category: 'Identidade visual',
    coverImage: './assets/aistudio/Ativo_17_10c8aaff.png',
    coverSurface: 'light',
  });
  assert.equal(lawLogo.fit, 'contain');
  assert.equal(lawLogo.surfaceClass, 'surface-light');
  assert.equal(logic.getShowcaseSurfaceClass('bordeaux'), 'surface-bordeaux');
});

test('validateQuoteInput rejects empty or invalid required fields', () => {
  const result = logic.validateQuoteInput({
    nome: 'A',
    email: 'invalido',
    whatsapp: '123',
    empresa: '',
    servico: '',
    descricao: 'Curta',
    prazo: '',
    investimento: '',
    referencias: '',
    lgpdConsent: false,
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.nome);
  assert.ok(result.errors.email);
  assert.ok(result.errors.whatsapp);
  assert.ok(result.errors.empresa);
  assert.ok(result.errors.servico);
  assert.ok(result.errors.descricao);
  assert.ok(result.errors.prazo);
  assert.ok(result.errors.investimento);
  assert.ok(result.errors.lgpdConsent);
});

test('validateQuoteInput accepts complete valid payload', () => {
  const result = logic.validateQuoteInput({
    nome: 'Mariana Souza',
    email: 'mariana@exemplo.com.br',
    whatsapp: '(11) 98765-4321',
    empresa: 'Café Botânico',
    servico: 'Branding e Identidade Visual',
    descricao: 'Precisamos de identidade visual completa e manual de marca para torrefação artesanal.',
    prazo: '30 a 45 dias',
    investimento: 'R$ 3.500 a R$ 7.000',
    referencias: 'https://behance.net',
    lgpdConsent: true,
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
});

test('validateContactInput enforces required fields and LGPD consent', () => {
  const invalid = logic.validateContactInput({
    nome: '',
    email: 'nope',
    assunto: 'Oi',
    mensagem: 'Curta',
    lgpdConsent: false,
  });
  assert.equal(invalid.valid, false);

  const valid = logic.validateContactInput({
    nome: 'Carlos Lima',
    email: 'carlos@studio.com',
    assunto: 'Parceria Editorial',
    mensagem: 'Gostaria de conversar sobre um projeto de capa de livro.',
    lgpdConsent: true,
  });
  assert.equal(valid.valid, true);
});

test('slugify and buildWhatsAppUrl format cleanly', () => {
  assert.equal(
    logic.slugify('Livro: O Pianista — Um Diário de Varsóvia!'),
    'livro-o-pianista-um-diario-de-varsovia'
  );
  const url = logic.buildWhatsAppUrl('(11) 99999-8888', 'Olá Sketch Studio!');
  assert.equal(url, 'https://wa.me/5511999998888?text=Ol%C3%A1%20Sketch%20Studio!');
  const studioUrl = logic.buildWhatsAppUrl('5511952535481', 'Olá!');
  assert.equal(studioUrl, 'https://wa.me/5511952535481?text=Ol%C3%A1!');
  assert.equal(logic.buildWhatsAppUrl('', 'Olá'), null);
  assert.equal(logic.isValidHexColor('#003F3F'), true);
  assert.equal(logic.isValidHexColor('003F3F'), false);
});
