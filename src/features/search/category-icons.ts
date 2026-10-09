import {
  Baby,
  Bike,
  Grid2X2,
  House,
  Laptop,
  Leaf,
  type LucideIcon,
  Shirt,
} from 'lucide-react'
import { searchCategories } from './rules'

const categoryIcons: Record<string, LucideIcon> = {
  maison: House,
  multimedia: Laptop,
  mode: Shirt,
  loisirs: Bike,
  enfants: Baby,
  jardin: Leaf,
}

const categoryHints: Record<string, string> = {
  maison: 'Meubles, déco, électroménager',
  multimedia: 'Téléphones, ordinateurs, consoles',
  mode: 'Vêtements, chaussures, accessoires',
  loisirs: 'Sport, vélos, livres, musique',
  enfants: 'Puériculture, jouets, vêtements',
  jardin: 'Outillage, mobilier d’extérieur, plantes',
}

export const AllCategoriesIcon = Grid2X2

export const navigationCategories = searchCategories.map((category) => ({
  ...category,
  Icon: categoryIcons[category.slug] ?? Grid2X2,
  hint: categoryHints[category.slug] ?? '',
}))
