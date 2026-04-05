import { type JSX } from 'solid-js';

export default function Icon(props: JSX.SvgSVGAttributes<SVGSVGElement>) {
  return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M5 2h4v2H5zm0 12h4v2H5zm0-6h4v2H5zm0 12h4v2H5zM3 4h2v4H3zm0 12h2v4H3zM9 4h2v4H9zm0 12h2v4H9zm0-8h2v2H9zm2 2h2v2h-2zm-2 4h2v2H9zm2-2h2v2h-2zm2-2h2v2h-2zm2 4h2v2h-2zm2 2h2v2h-2zm2 2h2v2h-2zM15 8h2v2h-2zm2-2h2v2h-2zm2-2h2v2h-2z"/></svg>);
}