// generated on 2019-12-28 using generator-webapp 4.0.0-7
const { src, dest, watch, series, parallel, lastRun } = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const fs = require('fs');
const mkdirp = require('mkdirp');
const Modernizr = require('modernizr');
const browserSync = require('browser-sync');
const del = require('del');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const { argv } = require('yargs');
const tildeImporter = require('node-sass-tilde-importer');
const browserify = require('browserify');
const babelify = require('babelify');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');
const ghpages = require('gh-pages');

const $ = gulpLoadPlugins();
const server = browserSync.create();

const port = argv.port || 9000;

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const isDev = !isProd && !isTest;

function views() {
  return src('app/*.njk')
    .pipe($.nunjucksRender({ path: 'app' }))
    .pipe(dest('.tmp'))
    .pipe(server.reload({ stream: true }));
};

function styles() {
  return src('app/styles/*.scss')
    .pipe($.plumber())
    .pipe($.if(!isProd, $.sourcemaps.init()))
    .pipe($.sass.sync({
      importer: tildeImporter,
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe($.postcss([
      autoprefixer()
    ]))
    .pipe($.if(!isProd, $.sourcemaps.write()))
    .pipe(dest('.tmp/styles'))
    .pipe(server.reload({stream: true}));
};

function scripts() {
  const b = browserify({
    entries: 'app/scripts/main.js',
    transform: babelify,
    debug: true
  });

  return b.bundle()
    .pipe(source('bundle.js'))
    .pipe($.plumber())
    .pipe(buffer())
    .pipe($.if(!isProd, $.sourcemaps.init({ loadMaps: true })))
    .pipe($.if(!isProd, $.sourcemaps.write('.')))
    .pipe(dest('.tmp/scripts'))
    .pipe(server.reload({stream: true}));
};

async function modernizr() {
  const readConfig = () => new Promise((resolve, reject) => {
    fs.readFile(`${__dirname}/modernizr.json`, 'utf8', (err, data) => {
      if (err) reject(err);
      resolve(JSON.parse(data));
    })
  })
  const createDir = () => new Promise((resolve, reject) => {
    mkdirp(`${__dirname}/.tmp/scripts`, err => {
      if (err) reject(err);
      resolve();
    })
  });
  const generateScript = config => new Promise((resolve, reject) => {
    Modernizr.build(config, content => {
      fs.writeFile(`${__dirname}/.tmp/scripts/modernizr.js`, content, err => {
        if (err) reject(err);
        resolve(content);
      });
    })
  });

  const [config] = await Promise.all([
    readConfig(),
    createDir()
  ]);
  await generateScript(config);
}

const lintBase = files => {
  return src(files)
    .pipe($.eslint({ fix: true }))
    .pipe(server.reload({stream: true, once: true}))
    .pipe($.eslint.format())
    .pipe($.if(!server.active, $.eslint.failAfterError()));
}
function lint() {
  return lintBase('app/scripts/**/*.js')
    .pipe(dest('app/scripts'));
};
function lintTest() {
  return lintBase('test/spec/**/*.js')
    .pipe(dest('test/spec'));
};

function html() {
  return src(['app/*.html', '.tmp/*.html'])
    .pipe($.useref({searchPath: ['.tmp', 'app', '.']}))
    .pipe($.if(/\.js$/, $.uglify({compress: {drop_console: true}})))
    .pipe($.if(/\.css$/, $.postcss([cssnano({safe: true, autoprefixer: false})])))
    .pipe($.if(/\.html$/, $.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: {compress: {drop_console: true}},
      processConditionalComments: true,
      removeComments: true,
      removeEmptyAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true
    })))
    .pipe(dest('dist'));
}

function images() {
  return src('app/images/**/*', { since: lastRun(images) })
    .pipe($.imagemin())
    .pipe(dest('dist/images'));
};

function iconsfont() {
  const fontName = 'icons';
  return src(['app/images/svg/icons/*.svg'])
    .pipe(
      $.iconfontCss({
        fontName: fontName,
        path: 'app/styles/_icons.tpl',
        targetPath: '../styles/core/_icons.scss',
        fontPath: '../fonts/'
      })
    )
    .pipe(
      $.iconfont({
        fontName: fontName,
        normalize: true,
        fontHeight: 1001
      })
    )
    .pipe(dest('app/fonts'));
}

function fonts() {
  return src('app/fonts/**/*.{eot,svg,ttf,woff,woff2}')
    .pipe($.if(!isProd, dest('.tmp/fonts'), dest('dist/fonts')));
};

function extras() {
  return src([
    'app/*',
    '!app/layouts',
    '!app/*.html',
    '!app/*.njk'
  ], {
    dot: true
  }).pipe(dest('dist'));
};

function clean() {
  return del(['.tmp', 'dist'])
}

function measureSize() {
  return src('dist/**/*')
    .pipe($.size({title: 'build', gzip: true}));
}

const build = series(
  clean,
  parallel(
    lint,
    series(parallel(views, styles, scripts, modernizr), html),
    images,
    iconsfont,
    fonts,
    extras
  ),
  measureSize
);

function startAppServer() {
  server.init({
    open: false,
    notify: false,
    https: true,
    port,
    server: {
      baseDir: ['.tmp', 'app'],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  });

  watch([
    'app/*.html',
    'app/images/**/*',
    '.tmp/fonts/**/*'
  ]).on('change', server.reload);

  watch('app/**/*.{html,njk}', views);
  watch('app/images/svg/icons/*.svg', iconsfont);
  watch('app/styles/**/*.scss', styles);
  watch('app/scripts/**/*.js', scripts);
  watch('modernizr.json', modernizr);
  watch('app/fonts/**/*', fonts);
}

function deploy() {
  return ghpages.publish('dist', {branch: 'master'}, function(err) {});
}

function startTestServer() {
  server.init({
    notify: false,
    port,
    ui: false,
    server: {
      baseDir: 'test',
      routes: {
        '/scripts': '.tmp/scripts',
        '/node_modules': 'node_modules'
      }
    }
  });

  watch('app/scripts/**/*.js', scripts);
  watch(['test/spec/**/*.js', 'test/index.html']).on('change', server.reload);
  watch('test/spec/**/*.js', lintTest);
}

function startDistServer() {
  server.init({
    notify: false,
    port,
    server: {
      baseDir: 'dist',
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  });
}

let serve;
if (isDev) {
  serve = series(clean, parallel(views, iconsfont, styles, scripts, modernizr, fonts), startAppServer);
} else if (isTest) {
  serve = series(clean, parallel(views, scripts), startTestServer);
} else if (isProd) {
  serve = series(build, startDistServer);
}

exports.deploy = deploy;
exports.serve = serve;
exports.build = build;
exports.default = build;
