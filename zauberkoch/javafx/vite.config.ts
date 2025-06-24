import {defineConfig, UserConfigFn} from 'vite';
import { overrideVaadinConfig } from './vite.generated';

const customConfig: UserConfigFn = (env) => ({
  // Here you can add custom Vite parameters
    base: "/",
  // https://vitejs.dev/config/
});

export default overrideVaadinConfig(customConfig);
