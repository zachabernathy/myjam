/**
 * Gulp Config
 *
 * This is preset to the optimal outputs. No changes should be needed.
 * If changes are needed, reference the package.json information first.
 *
 * @author Zach 'The Z Man' Abernathy <https://www.lifefromheretothere.com/>
 */

// Plugins
const
  package       = require('./package.json'),
  { argv }      = require('yargs'),
  autoprefixer  = require('autoprefixer'),
  cssnano       = require('cssnano'),
  tailwindcss   = require('tailwindcss'),
  pxtorem       = require('postcss-pxtorem')

// Transform to a friendlier name
const humanize = (str) => {
  return str.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Name for files using package.json name
const NAME = package.name

// Check for --production --prod --p flag
if (argv.production || argv.prod || argv.p)
  process.env.NODE_ENV = 'production'

const PROD = process.env.NODE_ENV === 'production'

// Check for --static flag
const STATIC = (argv.static) ? true : false

// Theme info
let                         themeinfofile  = 'Theme Name:        ' + humanize(NAME)  + '\n'
  if (package.uri)          themeinfofile += 'Theme URI:         ' + package.uri             + '\n'
  if (package.author.name)  themeinfofile += 'Author:            ' + package.author.name     + '\n'
  if (package.author.uri)   themeinfofile += 'Author URI:        ' + package.author.url      + '\n'
  if (package.description)  themeinfofile += 'Description:       ' + package.description     + '\n'
  if (package.tags)         themeinfofile += 'Tags:              ' + package.tags.toString() + '\n'
  if (package.requiresWP)   themeinfofile += 'Requires at least: ' + package.requiresWP      + '\n'
  if (package.testedWP)     themeinfofile += 'Tested up to:      ' + package.testedWP        + '\n'
  if (package.requiresPHP)  themeinfofile += 'Requires PHP:      ' + package.requiresPHP     + '\n'
  if (package.version)      themeinfofile += 'Version:           ' + package.version         + '\n'
  if (package.license)      themeinfofile += 'License:           ' + package.license         + '\n'
  if (package.licenseUri)   themeinfofile += 'License URI:       ' + package.licenseUri      + '\n'
  if (package.textdomain)   themeinfofile += 'Text Domain:       ' + package.textdomain      + '\n'

// Directories
const theme_dir = package.dir.wp + '/wp-content/themes/' + NAME

const dir = {
  src: package.dir.src,
  static: package.dir.static,
  theme: theme_dir,
  dist: STATIC ? package.dir.static : theme_dir
}

// Asset Paths
const paths = {
  tailwind: './tailwind.config.js',
  manifest: dir.dist + '/rev-manifest.json',
  styles: {
    src: [dir.src + '/styles/**/*.+(scss|sass)', '!' + dir.src + '/styles/vendor/**/*.+(min.css|css)'],
    vendor: [dir.src + '/styles/vendor/**/*.+(.min.css|.css)'],
    dest: dir.dist + '/styles/'
  },
  scripts: {
    src: [dir.src + '/scripts/**/*.js', '!' + dir.src + '/scripts/vendor/**/*.+(min.js|js)'],
    vendor: [dir.src + '/scripts/vendor/**/*.+(min.js|js)'],
    dest: dir.dist + '/scripts/'
  },
  php: {
    src: dir.src + '/php/**/*.php',
    dest: dir.static
  },
  fonts: {
    src: dir.src + '/fonts/**/*.+(svg|ttf|woff|woff2|eot)',
    dest: dir.dist + '/fonts/'
  },
  images: {
    src: dir.src + '/images/**/*.+(png|jpg|jpeg|gif|svg)',
    dest: dir.dist + '/images/'
  }
}

// Config
const config = {
  name: NAME,
  manifest: {
    base: dir.dist,
    merge: true
  },
  theme: {
    filename: 'style.css',
    readable: {
      objectMode: true
    }
  },
  clean: {
    assets: [
      dir.dist + '/styles/*',
      dir.dist + '/scripts/*',
      dir.dist + '/images/*',
      dir.dist + '/fonts/*'
    ],
    opt: {
      read: false,
      force: true
    }
  },
  browsersync: {
    default: {
      watch         : true,
      injectChanges : true
    },
    server: STATIC ? {
      server: {
        baseDir: dir.dist
      }
    } : {
      open: 'external',
      host: package.devhost,
      proxy: package.devhost
    }
  },
  scripts: {
    filename: NAME + '.js',
    babel: {
      presets: [
        '@babel/env'
      ]
    },
    eslint: {
      fix: true
    },
    uglify: {
      mangle: PROD ? true : false,
      output: {
        beautify: PROD ? false : true,
        comments: PROD ? false : true
      },
      compress: {
        pure_funcs: PROD ? [
          'console.log'
        ] : []
      }
    },
    vendor: {
      filename: 'vendor.js',
      opt: {}
    }
  },
  images: {
    optimizationLevel : 7,
    progressive       : true,
    verbose           : true,
    interlaced        : true,
    multipass         : true
  },
  styles: {
    filename: {
      basename: NAME
    },
    sass: {
      outputStyle     : PROD ? 'compact' : 'expanded'
    },
    postcss: [
      tailwindcss(paths.tailwind),
      cssnano,
      pxtorem,
      autoprefixer
    ],
    vendor: {
      basename: 'vendor'
    }
  }
}

// Ship it!
module.exports = {
  PROD,
  STATIC,
  themeinfofile,
  dir,
  paths,
  config
}