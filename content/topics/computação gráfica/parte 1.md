# 🖥️ Computação Gráfica — Resumo Aula 0: Apresentação do Curso

> **Prof. Ricardo P. Mesquita** | UniCarioca
> 📧 rmesquita@unicarioca.edu.br

---

## 📋 Avaliações

| Tipo | Descrição | Período |
|------|-----------|---------|
| **APS** | Testes disponibilizados no AVA | Ao longo do semestre |
| **AV** | Avaliação formal | 15/06 a 20/06 |

> ⚠️ **Importante:** Acessar o AVA regularmente para notas de aula e materiais de apoio.

---

## 📚 Bibliografia

### Básica
- AZEVEDO, E.; CONCI, A. — *Computação Gráfica: Teoria e Prática*. Campus, 2003.
- GOMES, J.; VELHO, L. — *Fundamentos da Computação Gráfica*. IMPA, 2003.
- JUNIOR, A. H. — *Computação Gráfica - Série Fundamentos de Informática*. LTC, 2006.

### Complementar
- AZEVEDO, E.; CONCI, A. — *Computação Gráfica: Teoria e Prática*, v.2. Campus, 2003.
- COHEN, M.; MANSSOUR, I. H. — *OpenGL - Uma Abordagem Prática e Objetiva*, v.1. Novatec, 2006.
- GOMES, J.; VELHO, L. — *Computação Gráfica: Imagem*. IMPA, 2002.
- GOMES, J.; VELHO, L. — *Computação Gráfica*, v.1. IMPA, 1998.
- GONÇALVES, M. S. — *Fundamentos de Computação Gráfica*. Érica, 2014.

---

## 🗂️ Conteúdo do Curso (10 Temas)

| # | Tema |
|---|------|
| 1 | Fundamentos Matemáticos para a Computação Gráfica |
| 2 | Pipeline Gráfico: Traçado de Curvas em Dispositivos Gráficos Matriciais |
| 3 | Transformações Geométricas |
| 4 | Visualização de Objetos: Transformações de Projeção |
| 5 | Curvas e Superfícies |
| 6 | Estruturas de Dados para a Computação Gráfica |
| 7 | Ray Tracing e Surface Shading |
| 8 | Mapeamento de Texturas |
| 9 | Sistemas de Cores |
| 10 | Animação Computacional |

---

## 🔷 Conceitos Básicos

### Subáreas da Computação Gráfica

```
┌─────────────────────────────────────────────────────────┐
│                   COMPUTAÇÃO GRÁFICA                    │
│                                                         │
│   [Síntese de Imagens]  →  Imagens  →  [Processamento] │
│         ↑                                     ↓         │
│    Descrições /                          [Análise de    │
│  Especificações                            Imagens]     │
│   Geométricas                                           │
└─────────────────────────────────────────────────────────┘
```

| Subárea | Descrição | Direção |
|---------|-----------|---------|
| **Síntese de Imagens (Rendering)** | Gera imagens a partir de modelos/descrições | Descrição → Imagem |
| **Processamento de Imagens** | Transforma imagens em outras imagens | Imagem → Imagem |
| **Análise de Imagens** | Extrai informação e reconhece padrões de imagens | Imagem → Descrição |

### Fluxo Geral da CG

```
Modelos Matemáticos → [Síntese / Rendering] → Imagens
                                ↕
                   [Análise / Reconhecimento de Padrões]
```

---

## 🔗 Disciplinas Relacionadas

A Computação Gráfica é **interdisciplinar** e se apoia em diversas áreas:

| Área | Disciplinas |
|------|-------------|
| **Computação** | Algoritmos, Estruturas de Dados, Métodos Numéricos |
| **Matemática** | Geometria Analítica, Geometria Descritiva, Geometria Euclidiana, Álgebra Linear |
| **Física** | Óptica, Mecânica |
| **Psicologia** | Percepção |
| **Artes** | — |

> 💡 A Álgebra Linear e a Geometria Analítica são especialmente fundamentais para transformações geométricas e projeções.

---

## ⚙️ Sistemas Gráficos

- Desenvolvidos para **padronizar** a construção de aplicativos gráficos.
- Objetivo principal: tornar as aplicações **independentes do hardware** — ou seja, garantir **portabilidade**.
- Vários padrões foram propostos ao longo do tempo (ex: OpenGL, DirectX, Vulkan).

---

## 🚀 Aplicações da Computação Gráfica

| Aplicação | Descrição |
|-----------|-----------|
| **CAD** (Computer-Aided Design) | Projeto e desenho assistido por computador |
| **CAGD** (Computer-Aided Geometric Design) | Desenho geométrico assistido por computador |
| **Visualização Científica** | Representação visual de dados científicos complexos |
| **GIS** (Geographic Information Systems) | Sistemas de Informações Geográficas / Cartografia |
| **Visualização Médica** | Imagens médicas, tomografias, simulações |
| **Interfaces** | Design de UI/UX para softwares e jogos |
| **Traçado de Gráficos** | Gráficos 2D/3D interativos |
| **Editoração Eletrônica** | Automação de escritórios, Photoshop, etc. |
| **Simulação e Animação** | Visualização científica, lazer, arte, publicidade |
| **Controle de Processos** | Monitoramento visual (ex: telas de radar de tráfego aéreo) |
| **Arte** | Modelagem e renderização 3D (ex: animações de filmes) |
| **Entretenimento / Educação** | Jogos, filmes, simuladores educacionais |

---

## 🖱️ Hardware Gráfico

Exemplos de dispositivos utilizados em Computação Gráfica:

- **GPU** (Placa de Vídeo) — ex: GeForce RTX — processa e renderiza imagens em alta velocidade
- **Monitor / Multi-monitor** — saída visual do sistema gráfico
- **Headset de Realidade Virtual (VR)** — ex: Meta Quest — imersão tridimensional
- **Óculos de Realidade Aumentada (AR)** — sobreposição de gráficos no mundo real

---

## 📌 Resumo Visual — Mapa Conceitual

```
                    COMPUTAÇÃO GRÁFICA
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
      Síntese         Processamento    Análise
    (Rendering)       de Imagens     de Imagens
          │
     Se apoia em:
    ┌─────┴──────┐
    │            │
  Matemática  Computação
  Física       Artes
  Psicologia
          │
     Aplicações:
  CAD, GIS, Medicina,
  Arte, Jogos, Simulação...
          │
     Hardware:
   GPU, VR, AR, Monitores
```

---

