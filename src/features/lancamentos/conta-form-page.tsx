import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { toast } from 'sonner'
import { addDays } from 'date-fns'
import { useData } from '@/store/data'
import { isoDayOf } from '@/lib/report'
import { CATEGORIAS_DESPESA } from '@/data/categorias'
import type { CategoriaDespesaId, Recorrencia } from '@/data/types'
import { CurrencyInput } from '@/components/shared/currency-input'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormShell, Field } from './form-parts'

const RECORRENCIAS: { value: Recorrencia; label: string }[] = [
  { value: 'unica', label: 'Única' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'anual', label: 'Anual' },
]

const schema = z.object({
  valor: z.number().positive('Informe um valor maior que zero.'),
  descricao: z.string().trim().min(2, 'Descreva a conta.'),
})

export function ContaFormPage() {
  const { fundos, addConta } = useData()
  const navigate = useNavigate()

  const [valor, setValor] = useState(0)
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState<CategoriaDespesaId>('outros')
  const [fornecedor, setFornecedor] = useState('')
  const [fundoId, setFundoId] = useState('f-geral')
  const [vencimento, setVencimento] = useState(isoDayOf(addDays(new Date(), 7)))
  const [recorrencia, setRecorrencia] = useState<Recorrencia>('mensal')
  const [erros, setErros] = useState<{ valor?: string; descricao?: string }>({})

  function salvar() {
    const res = schema.safeParse({ valor, descricao })
    if (!res.success) {
      const e: typeof erros = {}
      for (const issue of res.error.issues) e[issue.path[0] as 'valor' | 'descricao'] = issue.message
      setErros(e)
      return
    }
    addConta({
      descricao: descricao.trim(),
      categoria,
      valor,
      vencimento,
      status: 'pendente',
      recorrencia,
      fundoId,
      fornecedor: fornecedor.trim() || undefined,
    })
    toast.success('Conta a pagar cadastrada!')
    navigate('/contas')
  }

  return (
    <FormShell
      title="Nova conta a pagar"
      subtitle="Compromisso com vencimento"
      onSubmit={salvar}
      submitLabel="Cadastrar conta"
    >
      <Field label="Valor" error={erros.valor} htmlFor="valor">
        <CurrencyInput id="valor" value={valor} onChange={(v) => { setValor(v); setErros((e) => ({ ...e, valor: undefined })) }} autoFocus />
      </Field>

      <Field label="Descrição" error={erros.descricao} htmlFor="descricao">
        <Input
          id="descricao"
          value={descricao}
          onChange={(e) => { setDescricao(e.target.value); setErros((x) => ({ ...x, descricao: undefined })) }}
          placeholder="Ex.: Aluguel do templo"
        />
      </Field>

      <Field label="Categoria">
        <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaDespesaId)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIAS_DESPESA.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Vencimento" htmlFor="venc">
          <Input id="venc" type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
        </Field>
        <Field label="Recorrência">
          <Select value={recorrencia} onValueChange={(v) => setRecorrencia(v as Recorrencia)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECORRENCIAS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Fornecedor (opcional)" htmlFor="fornecedor">
        <Input id="fornecedor" value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} placeholder="Ex.: Imobiliária Central" />
      </Field>

      <Field label="Fundo">
        <Select value={fundoId} onValueChange={setFundoId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fundos.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </FormShell>
  )
}
