import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseEa20 } from './parser';

function load(name: string) {
  return JSON.parse(readFileSync(`./fixtures/${name}`, 'utf8'));
}

describe('parser', () => {
  it('parse Presidente BR oficial antes da divulgação', () => {
    const raw = load('br-c0001-e006257-u.json');
    const s = parseEa20(raw, 'presidente', 'BR', 1);
    expect(s.cargo).toBe('presidente');
    expect(s.abrangencia).toBe('BR');
    expect(s.andamento).toBe('n');
    expect(s.totalizacaoFinal).toBe(false);
    expect(s.divulgaVotacao).toBe(true);
    expect(s.secoes.total).toBeGreaterThan(0);
    expect(s.top5.length).toBeGreaterThan(0);
    expect(s.totalCandidatos).toBeGreaterThan(0);
  });

  it('parse Governador SP oficial', () => {
    const raw = load('sp-c0003-e006259-u.json');
    const s = parseEa20(raw, 'governador', 'SP', 1);
    expect(s.cargo).toBe('governador');
    expect(s.vagas).toBe(1);
    expect(s.top5[0].nomeUrna).toBeDefined();
    expect(s.top5[0].vice).toBeDefined();
  });

  it('parse Senador SP com suplentes', () => {
    const raw = load('sp-c0005-e006259-u.json');
    const s = parseEa20(raw, 'senador', 'SP', 1);
    expect(s.vagas).toBe(2);
    expect(s.top5[0].suplentes?.length).toBeGreaterThan(0);
  });

  it('parse Deputado Federal SP (proporcional)', () => {
    const raw = load('sp-c0006-e006259-u.json');
    const s = parseEa20(raw, 'deputado-federal', 'SP', 1);
    expect(s.totalCandidatos).toBeGreaterThan(5);
    expect(s.top5.length).toBe(5);
  });

  it('parse Deputado Estadual SP (proporcional, maior arquivo)', () => {
    const raw = load('sp-c0007-e006259-u.json');
    const s = parseEa20(raw, 'deputado-estadual', 'SP', 1);
    expect(s.totalCandidatos).toBeGreaterThan(5);
    expect(s.top5.length).toBe(5);
  });

  it('parse Deputado Distrital DF', () => {
    const raw = load('df-c0008-e006259-u.json');
    const s = parseEa20(raw, 'deputado-estadual', 'DF', 1);
    expect(s.codigoCargo).toBe('0008');
    expect(s.vagas).toBe(24);
  });

  it('parse simulado Presidente BR com totalização final', () => {
    const raw = load('br-c0001-e021270-u.json');
    const s = parseEa20(raw, 'presidente', 'BR', 1);
    expect(s.totalizacaoFinal).toBe(true);
    expect(s.andamento).toBe('f');
    expect(s.secoes.pct).toBe(100);
    expect(s.top5[0].votos).toBeGreaterThan(0);
  });

  it('ignora anulado no destaque mas mantém no ranking', () => {
    const raw = load('br-c0001-e021270-u.json');
    const s = parseEa20(raw, 'presidente', 'BR', 1);
    const anulado = s.top5.find(c => c.destinacao !== 'valido');
    expect(anulado).toBeDefined();
  });
});
