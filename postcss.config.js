import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import postcssImport from 'postcss-import'
import postcssNesting from 'postcss-nesting'

export default {
  plugins: [
    postcssImport,
    postcssNesting,
    tailwindcss,
    autoprefixer,
  ],
}