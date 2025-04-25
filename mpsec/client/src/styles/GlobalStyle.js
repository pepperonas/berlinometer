import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
  }

  body {
    font-family: ${({ theme }) => theme.typography.fontFamily};
    background-color: ${({ theme }) => theme.colors.backgroundDark};
    color: ${({ theme }) => theme.colors.textPrimary};
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    margin-bottom: ${({ theme }) => theme.spacing.md};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  h1 {
    font-size: ${({ theme }) => theme.typography.fontSize.xxxl};
  }

  h2 {
    font-size: ${({ theme }) => theme.typography.fontSize.xxl};
  }

  h3 {
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
  }

  h4 {
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
  }

  a {
    color: ${({ theme }) => theme.colors.accentBlue};
    text-decoration: none;
    transition: ${({ theme }) => theme.transitions.default};

    &:hover {
      text-decoration: underline;
    }
  }

  button, input, textarea, select {
    font-family: inherit;
  }

  button {
    cursor: pointer;
  }
`;

export default GlobalStyle;
