import { type JSX } from 'solid-js';

export default function Icon(props: JSX.SvgSVGAttributes<SVGSVGElement>) {
  return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 2048 2048" {...props}><path fill="currentColor" d="M2048 256v1536H0V256zm-128 128H128v512h256v256H128v512h1024v-256h256v256h256v-256h256zM640 896H384V640h256zm0 256V896h256v256zm512 0v256H896v-256zm512 0v256h-256v-256zm0-256h-256V640h256z"/></svg>);
}