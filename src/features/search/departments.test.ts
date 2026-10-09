import { describe, expect, it } from 'vitest'
import {
  departmentLabel,
  departmentName,
  frenchDepartments,
} from './departments'

describe('departments', () => {
  it('donne le nom officiel d’un département à partir de son code', () => {
    expect(departmentName('69')).toBe('Rhône')
    expect(departmentName('01')).toBe('Ain')
    expect(departmentName('95')).toBe('Val-d’Oise')
  })

  it('connaît la Corse et les départements d’outre-mer', () => {
    expect(departmentName('2A')).toBe('Corse-du-Sud')
    expect(departmentName('2b')).toBe('Haute-Corse')
    expect(departmentName('971')).toBe('Guadeloupe')
    expect(departmentName('976')).toBe('Mayotte')
  })

  it('recense les 101 départements français', () => {
    expect(frenchDepartments).toHaveLength(101)
    expect(new Set(frenchDepartments.map((d) => d.code)).size).toBe(101)
  })

  it('formate le libellé affiché avec le nom puis le code', () => {
    expect(departmentLabel('69')).toBe('Rhône (69)')
  })

  it('retombe sur un libellé générique pour un code inconnu', () => {
    expect(departmentName('20')).toBe('Département 20')
    expect(departmentLabel('99')).toBe('Département 99')
  })
})
