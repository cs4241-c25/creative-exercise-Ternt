import gltf from 'vite-plugin-gltf'
import { dedup, prune } from "@gltf-transform/functions";

export default () => { 
  return {
    build: {
      target: 'modules',
      base: 'public',
      dist: 'dist',
      sourcemap: 'true'
    },  
    plugins: [ 
      gltf({
        transforms: [
          prune(),
          dedup(),
        ]
      }) 
    ]
  }
}
