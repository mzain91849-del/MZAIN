import heroBurgerImg from './images/hero_signature_burger_1791607977074.jpg';
import smashBurgerImg from './images/product_smash_burger_1791607988789.jpg';
import crispyChickenImg from './images/product_crispy_chicken_1791608001745.jpg';
import woodfiredPizzaImg from './images/product_woodfired_pizza_1791608012125.jpg';
import loadedFriesImg from './images/product_loaded_fries_1791608022380.jpg';

export const IMAGE_REGISTRY: Record<string, string> = {
  hero_burger: heroBurgerImg,
  smash_burger: smashBurgerImg,
  crispy_chicken: crispyChickenImg,
  woodfired_pizza: woodfiredPizzaImg,
  loaded_fries: loadedFriesImg,
};

export function resolveProductImage(imageKey: string): string {
  if (!imageKey) return smashBurgerImg;
  if (IMAGE_REGISTRY[imageKey]) return IMAGE_REGISTRY[imageKey];
  if (
    imageKey.startsWith('http://') ||
    imageKey.startsWith('https://') ||
    imageKey.startsWith('/') ||
    imageKey.startsWith('data:image/')
  ) {
    return imageKey;
  }
  return smashBurgerImg;
}
