/**
 * Gulp + WordPress
 *
 * @since 0.0.1
 * @author Zach 'The Z Man' Abernathy <https://www.lifefromheretothere.com/>
 */

// Plugins
const
  package       = require('./package.json'),
  gulp          = require('gulp'),
  babel         = require('gulp-babel'),
  cache         = require('gulp-cache'),
  concat        = require('gulp-concat'),
  decompress    = require('gulp-decompress'),
  download      = require('gulp-download'),
  eslint        = require('gulp-eslint'),
  gulpif        = require('gulp-if'),
  imagemin      = require('gulp-imagemin'),
  newer         = require('gulp-newer'),
  php2html      = require('gulp-php2html'),
  postcss       = require('gulp-postcss'),
  rename        = require('gulp-rename'),
  rev           = require('gulp-rev'),
  sass          = require('gulp-sass'),
  sourcemaps    = require('gulp-sourcemaps'),
  uglify        = require('gulp-uglify'),
  browserSync   = require('browser-sync').create(),
  del           = require('del'),
  Readable      = require('stream').Readable,
  Vinyl         = require('vinyl')

const { pack } = require('tar-stream')
// Import config
const {
  PROD,
  STATIC,
  themeinfofile,
  dir,
  paths,
  config
} = require('./gulp.config.js')

/****************************
  WORDPRESS
****************************/
// Download WordPress
const download_wp = () => {
  return download(package.zips.wordpress)
    .pipe(gulp.dest("./downloads"))
}

// Create WordPress install directory
const create_wp_dir = () => {
  return gulp.src('*.*', {read: false})
    .pipe(gulp.dest(package.dir.wp))
}

// Unzip WordPress
const unzip_wp = () => {
  return gulp.src('./downloads/latest.tar.gz')
    .pipe(decompress({strip: 1}))
    .pipe(gulp.dest(package.dir.wp))
}

// Delete unused WordPress files and themes
const delete_wp_unused_files = () => {
  return del([
    package.dir.wp + '/license.txt',
    package.dir.wp + '/readme.html',
    package.dir.wp + '/wp-content/themes/**'
  ])
}

/****************************
  TASKS
****************************/
// Download Starter
const download_src = () => {
  return package.zips.theme ? download(package.zips.theme)
    .pipe(gulp.dest("./downloads")) : console.error('No theme ZIP defined!')
}

// Unzip Starter
const src_unzip = () => {
  return gulp.src('./downloads/main.zip')
    .pipe(decompress({strip: 1}))
    .pipe(gulp.dest(dir.src))
}

// Move src theme files into new theme
const src_move = () => {
  return gulp.src([dir.src + '/theme/**/*'])
  .pipe(gulp.dest(dir.theme))
}

// Clean asset folders
const clean_assets = () => {
  return del(config.clean.assets, config.clean.opt)
}

// Create theme style file
const create_themeinfo = () => {
  var stream = new Readable(config.theme.readable)

  stream.push(new Vinyl({
    path: config.theme.filename,
    contents: new Buffer.from('/*\n' + themeinfofile + '*/\n')
  }))

  stream.push(null)

  return stream.pipe(gulp.dest(dir.dist))
}

// Convert PHP to HTML for static development
const html = () => {
  return gulp
    .src(paths.php.src)
    .pipe(php2html())
    .pipe(gulp.dest(paths.php.dest))
}

// Create main stylesheet (SCSS or SASS accepted)
const styles = () => {
  return gulp
    .src(paths.styles.src)
    .pipe(gulpif(!PROD, sourcemaps.init()))
    .pipe(sass(config.styles.sass).on('error', sass.logError))
    .pipe(postcss(config.styles.postcss))
    .pipe(gulpif(!PROD, sourcemaps.write()))
    .pipe(rename(config.styles.filename))
    .pipe(gulpif(!STATIC, rev()))
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(gulpif(!STATIC, rev.manifest(paths.manifest, config.manifest)))
    .pipe(gulpif(!STATIC, gulp.dest(dir.dist)))
    .pipe(browserSync.stream())
}

// Concatinate and create vendor stylesheet
const vendor_styles = () => {
  return gulp
    .src(paths.styles.vendor)
    .pipe(rename(config.styles.vendor))
    .pipe(gulpif(!STATIC, rev()))
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(gulpif(!STATIC, rev.manifest(paths.manifest, config.manifest)))
    .pipe(gulpif(!STATIC, gulp.dest(dir.dist)))
    .pipe(browserSync.stream())
}

// Create main javascript
const scripts = () => {
  return gulp
    .src(paths.scripts.src)
    .pipe(eslint(config.scripts.eslint))
    .pipe(eslint.format())
    .pipe(gulpif(PROD, eslint.failAfterError()))
    .pipe(gulpif(!PROD, sourcemaps.init()))
    .pipe(babel(config.scripts.babel))
    .pipe(concat(config.scripts.filename))
    .pipe(uglify(config.scripts.uglify))
    .pipe(gulpif(!PROD, sourcemaps.write()))
    .pipe(gulpif(!STATIC, rev()))
    .pipe(gulp.dest(paths.scripts.dest))
    .pipe(gulpif(!STATIC, rev.manifest(paths.manifest, config.manifest)))
    .pipe(gulpif(!STATIC, gulp.dest(dir.dist)))
}

// Concatinate and create vendor javascript
const vendor_scripts = () => {
  return gulp
    .src(paths.scripts.vendor)
    .pipe(concat(config.scripts.vendor.filename, config.scripts.vendor.opt))
    .pipe(uglify(config.scripts.uglify))
    .pipe(gulpif(!STATIC, rev()))
    .pipe(gulp.dest(paths.scripts.dest))
    .pipe(gulpif(!STATIC, rev.manifest(paths.manifest, config.manifest)))
    .pipe(gulpif(!STATIC, gulp.dest(dir.dist)))
}

// Optimize images on build, passthrough for dev
const images = () => {
  return gulp
    .src(paths.images.src)
    .pipe(newer(paths.images.dest))
    .pipe(gulpif(PROD, cache(imagemin(config.images))))
    .pipe(gulp.dest(paths.images.dest))
}

// Copy fonts used
const fonts = () => {
  return gulp
    .src(paths.fonts.src)
    .pipe(newer(paths.fonts.dest))
    .pipe(gulp.dest(paths.fonts.dest))
}

// Local development Browsersync server
const serve = done => {
  browserSync.init({...config.browsersync.default,...config.browsersync.server})
  done()
}

// Reload Browsersync if necessary
const reload = done => {
  browserSync.reload()
  done()
}

// Watch for changes
const watch = () => {
  gulp.watch(paths.scripts.src, scripts)
  gulp.watch(paths.styles.src, styles)
  gulp.watch(paths.fonts.src, gulp.series(fonts, reload))
  gulp.watch(paths.images.src, gulp.series(images, reload))
  gulp.watch(paths.php.src, html)
  gulp.watch(dir.theme + '/**/*.php', reload)
}

/****************************
  BUILDING
****************************/
// Group asset building together for efficiency
const assets = gulp.parallel(scripts, vendor_scripts, styles, vendor_styles, fonts, images, html)

// Download, Unzip, Clean - WordPress
exports.wp = gulp.series(gulp.parallel(download_wp, create_wp_dir), unzip_wp, delete_wp_unused_files)

// Create the WordPress theme
exports.create_theme = gulp.series(download_src, src_unzip, src_move, create_themeinfo)

// Local Development - Static (HTML) or PHP
exports.dev = gulp.series(clean_assets, assets, html, serve, watch)

// Clean and Build new assets
exports.build = gulp.series(create_themeinfo, clean_assets, assets)