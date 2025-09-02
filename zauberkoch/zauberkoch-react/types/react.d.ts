/// <reference types="react" />
/// <reference types="react-dom" />

declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> {}
    interface ElementClass extends React.Component<any> {}
    interface ElementAttributesProperty {
      props: {}
    }
    interface ElementChildrenAttribute {
      children: {}
    }
    interface IntrinsicElements {
      [elemName: string]: any
    }
  }
}

export {};