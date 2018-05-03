import Masonry from 'masonry-layout';
import imagesLoaded from 'imagesloaded';

const grid = document.querySelector('.grid');

imagesLoaded(grid, () => {
  new Masonry(grid, {
    itemSelector: '.grid__item',
    columnWidth: '.grid__item',
    percentPosition: true,
    gutter: 15
  });
});
