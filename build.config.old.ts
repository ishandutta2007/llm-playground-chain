import { defineBuildConfig } from 'unbuild'
// import includePaths from 'rollup-plugin-includepaths';

let includePathOptions = {
    include: {},
    paths: ["src/*"],
    external: [],
    extensions: ['.js', '.ts', '.json', '.html']
};

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
  },
  // plugins: [ includePaths(includePathOptions) ],
})
