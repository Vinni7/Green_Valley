'use strict';

// Зависимости проекта
const gulp = require('gulp');
const less = require('gulp-less');
const debug = require('gulp-debug');
const sourcemaps = require('gulp-sourcemaps');
const cleanss = require('gulp-cleancss');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const mqpacker = require('css-mqpacker');
const rename = require('gulp-rename');
const gulpIf = require('gulp-if');
const del = require('del');
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const svgstore = require('gulp-svgstore');
const svgmin = require('gulp-svgmin');
const path = require('path');
const cheerio = require('gulp-cheerio');
const fileinclude = require('gulp-file-include');
const newer = require('gulp-newer');
const notify = require('gulp-notify');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const browserSync = require('browser-sync').create();
const replace = require('gulp-replace');
const ghPages = require('gulp-gh-pages');
const size = require('gulp-size');
const fs = require('fs');

// Запуск `NODE_ENV=production npm start [задача]` приведет к сборке без sourcemaps
const isDev = !process.env.NODE_ENV || process.env.NODE_ENV == 'dev';

// Запуск `port=3004 npm start` приведет к запуску сервера обновлений на 3004 порту и всей обычной автоматизации
const port = process.env.port ? process.env.port : 3000;



// Компиляция LESS
gulp.task('less', function () {
  console.log('---------- Компиляция LESS');
  return gulp.src('src/less/style.less')
    .pipe(gulpIf(isDev, sourcemaps.init()))
    .pipe(debug({title: "LESS:"}))
    .pipe(less())
    .on('error', notify.onError(function(err){
      return {
        title: 'Styles compilation error',
        message: err.message
      }
    }))
    .pipe(postcss([
        autoprefixer({browsers: ['last 3 version']}),
        mqpacker
    ]))
    .pipe(gulpIf(!isDev, cleanss()))
    .pipe(rename('style.css'))
    .pipe(debug({title: "RENAME:"}))
    .pipe(gulpIf(isDev, sourcemaps.write()))
    .pipe(size({
      title: 'Размер',
      showFiles: true,
      showTotal: false,
    }))
    .pipe(gulp.dest('build/css'))
    .pipe(browserSync.stream());
});

// Копирование и оптимизация изображений
gulp.task('img', function () {
  console.log('---------- Копирование и оптимизация картинок');
  return gulp.src('src/img/**/*.*', {since: gulp.lastRun('img')}) // только для изменившихся с последнего запуска файлов
    .pipe(newer('build/img'))  // оставить в потоке только изменившиеся файлы
    .pipe(imagemin({
        progressive: true,
        svgoPlugins: [{removeViewBox: false}],
        use: [pngquant()]
    }))
    .pipe(gulp.dest('build/img'));
});


// Сборка SVG-спрайта для блока sprite-svg--localstorage
// gulp.task('svgstore', function (callback) {
//   let spritePath = dirs.source + '/blocks/sprite-svg--localstorage/svg/';
//   if(fileExist(spritePath) !== false) {
//     console.log('---------- Сборка SVG спрайта');
//     return gulp.src(spritePath + '*.svg')
//       .pipe(svgmin(function (file) {
//         return {
//           plugins: [{
//             cleanupIDs: {
//               minify: true
//             }
//           }]
//         }
//       }))
//       .pipe(svgstore({ inlineSvg: true }))
//       .pipe(cheerio(function ($) {
//         $('svg').attr('style',  'display:none');
//       }))
//       .pipe(rename('sprite-svg--ls.svg'))
//       .pipe(size({
//         title: 'Размер',
//         showFiles: true,
//         showTotal: false,
//       }))
//       .pipe(gulp.dest(dirs.source + '/blocks/sprite-svg--localstorage/img'));
//   }
//   else {
//     console.log('---------- Сборка SVG спрайта: нет папки с картинками');
//     callback();
//   }
// });

// Сборка HTML
gulp.task('html', function() {
  console.log('---------- сборка HTML');
  return gulp.src('src/html/*.html')
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file',
      indent: true,
    }))
    .pipe(replace(/\n\s*<!--DEV[\s\S]+?-->/gm, ''))
    .pipe(gulp.dest('build/'));
});

// Конкатенация и углификация Javascript
gulp.task('js', function (callback) {
  console.log('---------- Обработка JS');
  return gulp.src(['bower_components/jquery/jquery-2.2.3.min.js','bower_components/owl.carousel/dist/owl.carousel.min.js','src/js/**/*.js'])
    .pipe(gulpIf(isDev, sourcemaps.init()))
    .pipe(concat('script.js'))
    .pipe(gulpIf(!isDev, uglify()))
    .on('error', notify.onError(function(err){
      return {
        title: 'Javascript uglify error',
        message: err.message
      }
    }))
    .pipe(gulpIf(isDev, sourcemaps.write('.')))
    .pipe(size({
      title: 'Размер',
      showFiles: true,
      showTotal: false,
    }))
    .pipe(gulp.dest('build/js'));
});

// Очистка папки сборки
gulp.task('clean', function () {
  console.log('---------- Очистка папки сборки');
  return del([
    'build/**/*',
    '!build/readme.md'
  ]);
});

// Сборка всего
gulp.task('build', gulp.series(
  'clean',
  gulp.parallel('less', 'img', 'js'),
  'html'
));

// Локальный сервер, слежение
gulp.task('serve', gulp.series('build', function() {
  browserSync.init({
    server: 'build/',
    port: port,
    startPath: 'index.html'
  });
  gulp.watch([
    'src/html/*.html',
  ], gulp.series('html', reloader));
  gulp.watch('src/less/**/*.less', gulp.series('less'));
  gulp.watch('src/img/**/*.*', gulp.series('img', reloader));
  gulp.watch('src/js/**/*.js', gulp.series('js', reloader));
}));

// Отправка в GH pages (ветку gh-pages репозитория)
gulp.task('deploy', function() {
  console.log('---------- Публикация ./build/ на GH pages');
  return gulp.src('./build/**/*')
    .pipe(ghPages());
});

// Задача по умолчанию
gulp.task('default',
  gulp.series('serve')
);


// Перезагрузка в браузере
function reloader(done) {
  browserSync.reload();
  done();
}
