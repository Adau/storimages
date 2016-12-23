import gulp from 'gulp';
import plugins from 'gulp-load-plugins';

// Chargement des plugins de package.json
const $ = plugins({
  pattern: ['*']
});

const PRODUCTION = !!($.yargs.argv.production);

// Initialisation du Serveur
gulp.task('server', () => {
  $.browserSync.init({
    server: 'dist'
  });
});

// Génération du template HTML
gulp.task('templates', () => {
  return gulp.src('src/templates/index.html')
    .pipe($.htmlExtend({ annotations: false }))
    .pipe(gulp.dest('dist'));
});

// Compilation des fichiers Sass
gulp.task('styles', () => {
  return gulp.src('src/assets/scss/main.scss')

    // Initialisation des Source Maps
    .pipe($.if(!PRODUCTION, $.sourcemaps.init()))

    // Compilation des fichiers Sass
    .pipe($.sass({
      includePaths: [
        'node_modules/bootstrap/scss',
        'node_modules/font-awesome/scss'
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
});

// Génération du fichier JavaScript principal
gulp.task('scripts', () => {
  return gulp.src([
    'node_modules/jquery/dist/jquery.js',
    'node_modules/tether/dist/js/tether.js',
    'node_modules/bootstrap/dist/js/bootstrap.js',
    'src/assets/js/**/*'
  ])

    // Initialisation des Source Maps
    .pipe($.if(!PRODUCTION, $.sourcemaps.init()))

    // Compilation des fichiers ES2015
    // .pipe($.babel({
    //   presets: ['es2015']
    // }))

    // Concaténation des fichiers JavaScript
    .pipe($.concat('main.js'))

    // Minification des fichiers JS
    .pipe($.if(PRODUCTION, $.uglify()))

    // Écriture des Source Maps
    .pipe($.if(!PRODUCTION, $.sourcemaps.write('./')))

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
  return gulp.src('node_modules/font-awesome/fonts/**/*')
    .pipe(gulp.dest('./dist/assets/fonts'));
});

// Nettoyage du dossier de destination
gulp.task('clean', (callback) => {
  $.rimraf('dist', callback)
});

// Génération des différents assets
gulp.task('build', ['clean'], function () {
  gulp.start('templates', 'styles', 'scripts', 'images', 'fonts');
});

gulp.task('default', ['build']);

// Surveillance automatique des fichiers sources
gulp.task('watch', ['build', 'server'], () => {
  gulp.watch('src/**/*.html', ['templates', $.browserSync.reload]);
  gulp.watch('src/assets/scss/**/*.scss', ['styles', $.browserSync.reload]);
  gulp.watch('src/assets/js/**/*', ['scripts', $.browserSync.reload]);
  gulp.watch('src/assets/img/**/*', ['images', $.browserSync.reload]);
});
