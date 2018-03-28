import plugins from 'gulp-load-plugins';
import { name } from './package.json';

// Chargement des plugins de package.json
const $ = plugins({
  pattern: ['*']
});

const gulp = $.gulp;
const PRODUCTION = !!($.yargs.argv.production);
const webpack = require('webpack');

// Initialisation du Serveur
gulp.task('server', () => {
  $.browserSync.init({
    server: 'dist',
    files: 'dist'
  });
});

// Génération du template HTML
gulp.task('templates', () => {
  return gulp.src('src/templates/**/*.html')
    .pipe($.data(() => {
      const data = JSON.parse($.fs.readFileSync('./src/data/data.json'));
      data.site.baseurl = PRODUCTION ? `/${name}` : '';
      return data;
    }))
    .pipe($.nunjucks.compile())
    .pipe(gulp.dest('dist'));
});

// Validation des fichiers Sass
gulp.task('sass-lint', () => {
  return gulp.src('src/assets/scss/**/*.scss')
    .pipe($.sassLint())
    .pipe($.sassLint.format())
    .pipe($.sassLint.failOnError());
});

// Compilation des fichiers Sass
gulp.task('styles', gulp.series('sass-lint', () => {
  return gulp.src('src/assets/scss/main.scss')

    // Initialisation des Source Maps
    .pipe($.if(!PRODUCTION, $.sourcemaps.init()))

    // Compilation des fichiers Sass
    .pipe($.sass({
      includePaths: [
        'node_modules/bootstrap/scss',
        'node_modules/@fortawesome/fontawesome-free-webfonts/scss'
      ]
    }).on('error', $.sass.logError))

    // Ajout des préfixes vendeurs
    .pipe($.autoprefixer('last 2 version'))

    // Écriture des Source Maps
    .pipe($.if(!PRODUCTION, $.sourcemaps.write('./')))

    // Minification des fichiers CSS
    .pipe($.if(PRODUCTION, $.cssnano()))

    // Écriture des fichiers CSS
    .pipe(gulp.dest('./dist/assets/css'));
}));

// Génération du fichier JavaScript principal
gulp.task('scripts', () => {
  return gulp.src('src/assets/js/main.js')

    // Webpack
    .pipe($.webpackStream({
      output: {
        filename: 'main.min.js'
      },
      devtool: 'source-map',
      module: {
        rules: [{
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['es2015']
            }
          }
        }
      ]},
      plugins: [
        new webpack.DefinePlugin({
          'process.env': {
            NODE_ENV: PRODUCTION ? '"production"' : '"development"'
          }
        }),
        new webpack.ProvidePlugin({
          jQuery: 'jquery',
          $: 'jquery',
          Popper: ['popper.js', 'default']
        })
      ].concat(
        PRODUCTION ? new webpack.optimize.UglifyJsPlugin() : []
      )
    }))

    // Écriture des fichiers JS
    .pipe(gulp.dest('./dist/assets/js'));
});

// Optimisation des images
gulp.task('images', () => {
  return gulp.src('src/assets/img/**/*')
    .pipe($.imagemin())
    .pipe(gulp.dest('./dist/assets/img'));
});

// Copie des polices de caractère externes
gulp.task('fonts', () => {
  return gulp.src('node_modules/@fortawesome/fontawesome-free-webfonts/webfonts/**/*')
    .pipe(gulp.dest('./dist/assets/webfonts'));
});

// Nettoyage du dossier de destination
gulp.task('clean', (callback) => {
  $.rimraf('dist/**/*', callback);
});

// Génération des différents assets
gulp.task('build', gulp.series('clean', gulp.parallel('templates', 'styles', 'scripts', 'images', 'fonts')));

gulp.task('default', gulp.series('build'));

// Surveillance automatique des fichiers sources
gulp.task('watch', gulp.parallel('server', () => {
  gulp.watch(['src/templates/**/*', './src/data/data.json'], gulp.series('templates'));
  gulp.watch('src/assets/scss/**/*.scss', gulp.series('styles'));
  gulp.watch('src/assets/js/**/*.js', gulp.series('scripts'));
  gulp.watch('src/assets/img/**/*', gulp.series('images'));
}));
