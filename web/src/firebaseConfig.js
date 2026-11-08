// Configuração do Firebase (Console do Firebase → Configurações do projeto → Seus apps → app Web → "Config").
// Enquanto apiKey estiver vazio, o jogo roda em MODO DEMONSTRAÇÃO: contas e ranking ficam só neste navegador.
// Passo a passo em docs/contas.md.
export const FIREBASE_CONFIG = {
  // app Web "Neko G Web" do projeto neko-g (estas chaves são públicas por natureza; quem protege os dados são as regras do Firestore)
  apiKey: 'AIzaSyAcK5DGTlXOo9J92z_YK1Hootp3DPlsM1I',
  authDomain: 'neko-g.firebaseapp.com',
  projectId: 'neko-g',
  storageBucket: 'neko-g.firebasestorage.app',
  messagingSenderId: '917194353955',
  appId: '1:917194353955:web:128a4c77ec5ba95bd6f096',
  measurementId: 'G-1WE5618TV4',
};

export const FIREBASE_SDK = 'https://www.gstatic.com/firebasejs/13.2.0/';
