# 📐 Computação Gráfica — Resumo Aula 1: Fundamentos Matemáticos

> **Tema 1** | Prof. Ricardo P. Mesquita

---

## 1. Conjuntos e Mapeamentos

### 1.1 Definição de Mapeamento (Função)
- Um **mapeamento** (ou **função**) recebe um argumento de um tipo e o transforma em um objeto de outro tipo.
- Em programação → **tipo**; em matemática → **conjunto**.
- Notação: `f: A ↦ B` (f leva elementos de A para B)

### 1.2 Produto Cartesiano
- Dados dois conjuntos **A** e **B**, o **produto cartesiano** `A × B` é o conjunto de todos os **pares ordenados** `(a, b)` onde `a ∈ A` e `b ∈ B`.
- Notação abreviada: `A²` = `A × A`
- Extensão para 3 conjuntos: `A × B × C` → **triplas ordenadas** (base do espaço 3D!)

```
Exemplo visual:
  A = {1, 2}   B = {x, y}
  A × B = {(1,x), (1,y), (2,x), (2,y)}
```

### 1.3 Conjuntos de Interesse Comum na CG

| Símbolo | Significado |
|---------|-------------|
| **ℝ** | Números reais |
| **ℝ⁺** | Números reais não-negativos |
| **ℝ²** | Pares ordenados — plano 2D `(x, y)` |
| **ℝ³** | Triplas ordenadas — espaço 3D `(x, y, z)` |
| **ℝⁿ** | Pontos em espaço cartesiano n-dimensional |
| **ℤ** | Números inteiros |
| **S²** | Pontos de ℝ³ sobre uma esfera unitária |

> 💡 **Por que isso importa em CG?** Todo ponto/pixel é um elemento de ℝ² ou ℝ³. Transformações são funções entre esses conjuntos.

---

## 2. Mapeamento Inverso (Bijeção)

- Dada `f: A ↦ B`, a **função inversa** é `f⁻¹: B ↦ A`, tal que:
  - `f⁻¹(b) = a`  quando  `f(a) = b`
- Um mapeamento com inversa é chamado de **bijeção**.

**Exemplo:**
```
f: ℝ ↦ ℝ,   f(x) = x³
f⁻¹(x) = ∛x
```

> ⚠️ Nem toda função tem inversa! Só bijeções (1-a-1 e sobrejetoras) a possuem.

---

## 3. Intervalos

### 3.1 Notação
Usados para restringir o domínio de funções a subconjuntos dos reais:

| Notação | Significado | Exemplo |
|---------|-------------|---------|
| `(a, b)` | Aberto — **não** inclui a e b | `a < x < b` |
| `[a, b]` | Fechado — **inclui** a e b | `a ≤ x ≤ b` |
| `(a, b]` | Semi-aberto à esquerda | `a < x ≤ b` |
| `[a, b)` | Semi-aberto à direita | `a ≤ x < b` |

### 3.2 Operações com Intervalos
Dados `A = [3, 5)` e `B = [4, 6]`:

| Operação | Resultado | Descrição |
|----------|-----------|-----------|
| `A ∩ B` | `[4, 5)` | Interseção |
| `A ∪ B` | `[3, 6]` | União |
| `A − B` | `[3, 4)` | Diferença A menos B |
| `B − A` | `[5, 6]` | Diferença B menos A |

---

## 4. Exponenciação

### 4.1 Definição
> `aⁿ = a · a · a · ... · a` (n vezes)

- `a¹ = a`
- `a⁰ = 1`

### 4.2 Propriedades

| Propriedade | Fórmula |
|-------------|---------|
| Produto de mesma base | `aᵐ · aⁿ = aᵐ⁺ⁿ` |
| Divisão de mesma base | `aᵐ / aⁿ = aᵐ⁻ⁿ` |
| Potência de potência | `(aᵐ)ⁿ = aᵐ·ⁿ` |
| Raiz como potência | `ᵐ√aⁿ = aⁿ/ᵐ` |
| Expoente negativo | `a⁻ⁿ = 1/aⁿ` |
| Potência de fração | `(a/b)ⁿ = aⁿ/bⁿ` |
| Fração com exp. negativo | `(a/b)⁻ⁿ = (b/a)ⁿ` |
| Produto elevado | `(a·b)ⁿ = aⁿ·bⁿ` |

---

## 5. Logaritmos

### 5.1 Definição
> `logₐ b = x  ⟺  aˣ = b`  
> (com `a, b > 0` e `a ≠ 1`)

- Decorre diretamente: `a^(logₐ b) = b`

### 5.2 Propriedades

| Propriedade | Fórmula |
|-------------|---------|
| Log de 1 | `logₐ 1 = 0` |
| Log da base | `logₐ a = 1` |
| Igualdade | `logₐ b = logₐ c ⟺ b = c` |
| Produto | `logₐ(b·c) = logₐ b + logₐ c` |
| Quociente | `logₐ(b/c) = logₐ b − logₐ c` |
| Potência do logaritmando | `logₐ bᵅ = α · logₐ b` |
| Mudança de base | `logₐ b = logc b / logc a` |
| Inversão de base | `logₐ b = 1 / logb a` |
| Base com expoente | `log_{aᵝ} b = (1/β) · logₐ b` |

---

## 6. Funções Trigonométricas

### 6.1 Teorema de Pitágoras
> `h² = a² + o²`  
> (h = hipotenusa, a = adjacente, o = oposto)

### 6.2 Definições das Funções (ângulo φ)

| Função | Definição | Mnemônico |
|--------|-----------|-----------|
| `sin φ` | `o / h` | oposto / hipotenusa |
| `cos φ` | `a / h` | adjacente / hipotenusa |
| `tan φ` | `o / a` | oposto / adjacente |
| `csc φ` | `h / o` | inverso do seno |
| `sec φ` | `h / a` | inverso do cosseno |
| `cot φ` | `a / o` | inverso da tangente |

### 6.3 Identidades Fundamentais

**Paridade:**
```
sin(-A) = -sin A       cos(-A) = cos A       tan(-A) = -tan A
sin(π/2 - A) = cos A   cos(π/2 - A) = sin A  tan(π/2 - A) = cot A
```

**Pitagóricas:**
```
sin²A + cos²A = 1
sec²A − tan²A = 1
csc²A − cot²A = 1
```

**Adição e subtração:**
```
sin(A+B) = sinA cosB + sinB cosA
sin(A-B) = sinA cosB - sinB cosA
cos(A+B) = cosA cosB - sinA sinB
cos(A-B) = cosA cosB + sinA sinB
tan(A+B) = (tanA + tanB) / (1 - tanA tanB)
tan(A-B) = (tanA - tanB) / (1 + tanA tanB)
```

**Duplo ângulo:**
```
sin(2A) = 2 sinA cosA
cos(2A) = cos²A - sin²A
tan(2A) = 2tanA / (1 - tan²A)
```

**Meio ângulo:**
```
sin²(A/2) = (1 - cosA) / 2
cos²(A/2) = (1 + cosA) / 2
```

**Produto para soma:**
```
sinA sinB = -(cos(A+B) - cos(A-B)) / 2
sinA cosB = -(sin(A+B) + sin(A-B)) / 2
cosA cosB = -(cos(A+B) + cos(A-B)) / 2
```

---

## 7. Vetores

### 7.1 Definição
- Um **vetor** descreve um **comprimento** (módulo) e uma **direção**.
- Representado graficamente por uma **seta**.
- Operação básica: adição de vetores (regra do paralelogramo).

### 7.2 Coordenadas Cartesianas

**Independência Linear e Base:**
- Um vetor 2D pode ser escrito como combinação de 2 vetores **não paralelos** e **não nulos** → chamados de **vetores de base**.
- Essa propriedade é chamada de **independência linear**.

```
ĉ = aₐ â + bₐ b̂       (base genérica)
ĉ = xc x̂ + yc ŷ       (base cartesiana)
```

**Comprimento (módulo) de um vetor:**
```
||c|| = √(xc² + yc²)      (2D)
||c|| = √(xc² + yc² + zc²) (3D)
```

**Representação como matriz coluna:**
```
     [xc]
c =  [yc]
```

### 7.3 Resumo Vetores 2D vs 3D

| Aspecto | 2D | 3D |
|---------|----|----|
| Conjunto | ℝ² | ℝ³ |
| Componentes | (x, y) | (x, y, z) |
| Base canônica | x̂, ŷ | x̂, ŷ, ẑ |
| Comprimento | `√(x²+y²)` | `√(x²+y²+z²)` |

---

## 8. Matrizes

### 8.1 Definição
> Uma **matriz** é um array retangular de elementos numéricos (m linhas × n colunas).

```
Exemplo (2×3):
[ 1.7  -1.2   4.2 ]
[ 3.0   4.5  -7.2 ]
```

### 8.2 Aritmética de Matrizes

**Multiplicação por escalar:**
```
2 × [1 -4] = [2  -8]
    [3  2]   [6   4]
```

**Adição (mesmas dimensões):**
```
[1 -4] + [2 2] = [3 -2]
[3  2]   [2 2]   [5  4]
```

**Multiplicação de matrizes** (A é r×m, B é m×c → resultado P é r×c):
```
pᵢⱼ = aᵢ₁b₁ⱼ + aᵢ₂b₂ⱼ + ... + aᵢₘbₘⱼ
```

### 8.3 Propriedades da Multiplicação

| Propriedade | Regra |
|-------------|-------|
| ❌ **Não comutativa** | `AB ≠ BA` |
| ✅ **Associativa** | `(AB)C = A(BC)` |
| ✅ **Distributiva** | `A(B+C) = AB + AC` |
| ✅ **Distributiva** | `(A+B)C = AC + BC` |

> ⚠️ **IMPORTANTE:** A ordem importa! `AB ≠ BA` é uma das armadilhas mais comuns.

---

## 9. Equações Analíticas

### 9.1 Equação da Reta

```
Forma explícita:   y = ax + b
Forma ponto-inclinação: y - y₁ = m(x - x₁)

onde:  m = (y₂ - y₁) / (x₂ - x₁)   (coeficiente angular)
```

### 9.2 Equação da Circunferência

```
(x - a)² + (y - b)² = r²

Centro: (a, b)   Raio: r
```

### 9.3 Equação da Elipse

```
x²/a² + y²/b² = 1

Semi-eixo horizontal: a
Semi-eixo vertical:   b
```

---

## 10. Resolução Gráfica

### 10.1 Parâmetros de um Dispositivo Gráfico
> Resolução = número de posições distintas que o dispositivo pode distinguir.

| Parâmetro | Descrição |
|-----------|-----------|
| `ndh` | Número de pontos horizontalmente endereçáveis |
| `ndv` | Número de pontos verticalmente endereçáveis |
| `width` | Largura física (mm) |
| `height` | Altura física (mm) |

### 10.2 Fórmulas Derivadas

| Grandeza | Fórmula |
|----------|---------|
| Resolução horizontal | `horiz_res = ndh / width` |
| Tamanho ponto horizontal | `horiz_dot_size = width / ndh` |
| Resolução vertical | `vert_res = ndv / height` |
| Tamanho ponto vertical | `vert_dot_size = height / ndv` |
| Total de pontos | `total_nr_dots = ndh × ndv` |
| Resolução de área | `area_res = total_nr_dots / (width × height)` |
| Razão de aspecto gráfica | `aspect_ratio = vert_dot_size / horiz_dot_size` |
| Razão de aspecto física | `physical_aspect_ratio = height / width` |

---

## 11. Sistemas de Coordenadas

### 11.1 Tipos de Coordenadas

| Tipo | Notação | Descrição |
|------|---------|-----------|
| **Dispositivo (DC)** | `(dcx, dcy)` | Inteiros — pixels reais na tela |
| **Normalizadas (NDC)** | `(ndcx, ndcy)` | Reais entre 0 e 1 — independente do dispositivo |
| **Físicas (PC)** | `(pcx, pcy)` | Em milímetros |
| **Mundo** | `(X, Y)` | Coordenadas do espaço da aplicação/usuário |

### 11.2 Fórmulas de Mapeamento

**Usuário → NDC (normalização):**
```
ndcx = (x - xmin) / (xmax - xmin)
ndcy = (y - ymin) / (ymax - ymin)
```

**NDC → DC (conversão para dispositivo):**
```
dcx = round(ndcx × (ndh - 1))
dcy = round(ndcy × (ndv - 1))
```

**PC → DC (coordenadas físicas para dispositivo):**
```
dcx = trunc((ndh - 1) × pcx / width)
dcy = trunc((ndv - 1) × pcy / height)
```

### 11.3 Fluxo do Pipeline de Coordenadas

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   Coordenadas      →      NDC      →   Coordenadas      │
│   do Mundo (X,Y)       (NDCX, NDCY)    Dispositivo      │
│        ↑                   ↑           (DCX, DCY)        │
│        └───────────────────┘                             │
│    Coord. Entrada DC  →  NDC  →  Coord. Saída DC         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

> 💡 O uso de **NDC** garante portabilidade: a aplicação trabalha em [0,1] e o sistema converte para qualquer dispositivo.

---

## 📌 Mapa Mental — Fundamentos Matemáticos

```
FUNDAMENTOS MATEMÁTICOS PARA CG
│
├── TEORIA DOS CONJUNTOS
│   ├── Mapeamentos / Funções
│   ├── Produto Cartesiano → ℝ², ℝ³
│   ├── Conjuntos Especiais (ℝ, ℤ, S²...)
│   ├── Mapeamento Inverso (Bijeção)
│   └── Intervalos (aberto, fechado, semi-aberto)
│
├── ÁLGEBRA
│   ├── Exponenciação (8 propriedades)
│   └── Logaritmos (9 propriedades)
│
├── TRIGONOMETRIA
│   ├── Pitágoras: h² = a² + o²
│   ├── sin, cos, tan, csc, sec, cot
│   └── Identidades (paridade, duplo ângulo, adição...)
│
├── ÁLGEBRA LINEAR
│   ├── Vetores (direção + magnitude)
│   │   ├── Independência Linear
│   │   ├── Vetores de Base
│   │   └── Norma: ||v|| = √(x²+y²+z²)
│   └── Matrizes
│       ├── Aritmética (soma, multiplicação)
│       └── Propriedades (não comutativa, associativa)
│
├── GEOMETRIA ANALÍTICA
│   ├── Reta: y = ax + b
│   ├── Circunferência: (x-a)²+(y-b)²=r²
│   └── Elipse: x²/a² + y²/b² = 1
│
└── SISTEMAS DE COORDENADAS
    ├── DC  → pixels inteiros
    ├── NDC → reais [0,1] — portabilidade!
    ├── PC  → milímetros
    └── Fórmulas de conversão entre sistemas
```

---

> 🔜 **Próxima Aula:** Tema 2 — Pipeline Gráfico: Traçado de Curvas em Dispositivos Gráficos Matriciais