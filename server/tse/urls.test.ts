import { describe, it, expect } from 'vitest';
import { urlResultado, urlConfigEleicoes, urlAcompanhamento, urlFoto } from './urls';
import type { TseMeta } from './types';

const meta: TseMeta = {
  baseUrl: 'https://resultados.tse.jus.br',
  ambienteComum: 'oficial',
  ambiente: 'oficial',
  ciclo: 'ele2026',
  pleito: '3220',
  turno: 1,
  eleicaoFederal: '6257',
  eleicaoEstadual: '6259',
  cargos: [],
  ufs: ['SP'],
};

describe('urls', () => {
  it('gera URL de config', () => {
    expect(urlConfigEleicoes(meta)).toBe('https://resultados.tse.jus.br/oficial/comum/config/ele-c.json');
  });

  it('gera URL de Presidente BR com padding correto', () => {
    expect(urlResultado(meta, 'presidente', 'BR')).toBe(
      'https://resultados.tse.jus.br/oficial/ele2026/6257/dados/br/br-c0001-e006257-u.json',
    );
  });

  it('gera URL de Governador SP', () => {
    expect(urlResultado(meta, 'governador', 'SP')).toBe(
      'https://resultados.tse.jus.br/oficial/ele2026/6259/dados/sp/sp-c0003-e006259-u.json',
    );
  });

  it('gera URL de Deputado Distrital DF', () => {
    expect(urlResultado(meta, 'deputado-estadual', 'DF')).toBe(
      'https://resultados.tse.jus.br/oficial/ele2026/6259/dados/df/df-c0008-e006259-u.json',
    );
  });

  it('gera URL de acompanhamento', () => {
    expect(urlAcompanhamento(meta, 'SP', 'estadual')).toBe(
      'https://resultados.tse.jus.br/oficial/ele2026/6259/dados/sp/sp-e006259-ab.json',
    );
  });

  it('gera URL de foto', () => {
    expect(urlFoto(meta, '123', 'SP', 'estadual')).toBe(
      'https://resultados.tse.jus.br/oficial/ele2026/6259/fotos/sp/123.jpeg',
    );
  });
});
