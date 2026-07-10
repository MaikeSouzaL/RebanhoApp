import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { toast } from 'sonner'
import { useData } from '@/store/data'
import { isoDayOf } from '@/lib/report'
import { CATEGORIAS_DESPESA, FORMA_LABEL } from '@/data/categorias'
import type { CategoriaDespesaId, FormaPagamento } from '@/data/types'
import { CurrencyInput } from '@/components/shared/currency-input'
import { PhotoInput } from '@/components/shared/photo-input'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormShell, Field } from './form-parts'

const FORMAS: FormaPagamento[] = ['pix', 'dinheiro', 'cartao', 'transferencia']

const schema = z.object({
  valor: z.number().positive('Informe um valor maior que zero.'),
  descricao: z.string().trim().min(2, 'Descreva a despesa.'),
})

export function DespesaFormPage() {
  const { saidas, fundos, addSaida, updateSaida } = useData()
  const navigate = useNavigate()
  const { id } = useParams()
  const existing = id ? saidas.find((s) => s.id === id) : undefined
  const editando = !!existing

  const [valor, setValor] = useState(existing?.valor ?? 0)
  const [categoria, setCategoria] = useState<CategoriaDespesaId>(existing?.categoria ?? 'materiais')
  const [descricao, setDescricao] = useState(existing?.descricao ?? '')
  const [fornecedor, setFornecedor] = useState(existing?.fornecedor ?? '')
  const [fundoId, setFundoId] = useState(existing?.fundoId ?? 'f-geral')
  const [data, setData] = useState(existing?.data ?? isoDayOf(new Date()))
  const [forma, setForma] = useState<FormaPagamento>(existing?.forma ?? 'pix')
  const [comprovanteUrl, setComprovanteUrl] = useState<string | undefined>(existing?.comprovanteUrl)
  const [obs, setObs] = useState(existing?.obs ?? '')
  const [erros, setErros] = useState<{ valor?: string; descricao?: string }>({})

  if (id && !existing) {
    return <div className="py-16 text-center text-muted-foreground">Lançamento não encontrado.</div>
  }

  function salvar() {
    const res = schema.safeParse({ valor, descricao })
    if (!res.success) {
      const e: typeof erros = {}
      for (const issue of res.error.issues) e[issue.path[0] as 'valor' | 'descricao'] = issue.message
      return setErros(e)
    }
    const payload = {
      categoria,
      descricao: descricao.trim(),
      fornecedor: fornecedor.trim() || undefined,
      valor,
      data,
      forma,
      fundoId,
      comprovante: !!comprovanteUrl,
      comprovanteUrl,
      obs: obs.trim() || undefined,
    }
    if (editando) updateSaida(existing!.id, payload)
    else addSaida(payload)
    toast.success(editando ? 'Despesa atualizada!' : 'Despesa registrada!')
    navigate('/lancamentos')
  }

  return (
    <FormShell
      title={editando ? 'Editar despesa' : 'Registrar despesa'}
      subtitle="Um gasto já pago"
      onSubmit={salvar}
      submitLabel={editando ? 'Salvar alterações' : 'Salvar despesa'}
    >
      <Field label="Valor" error={erros.valor} htmlFor="valor">
        <CurrencyInput id="valor" value={valor} onChange={(v) => { setValor(v); setErros((e) => ({ ...e, valor: undefined })) }} autoFocus={!editando} />
      </Field>

      <Field label="Categoria">
        <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaDespesaId)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIAS_DESPESA.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Descrição" error={erros.descricao} htmlFor="descricao">
        <Input id="descricao" value={descricao} onChange={(e) => { setDescricao(e.target.value); setErros((x) => ({ ...x, descricao: undefined })) }} placeholder="Ex.: Conta de energia" />
      </Field>

      <Field label="Fornecedor (opcional)" htmlFor="fornecedor">
        <Input id="fornecedor" value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} placeholder="Ex.: Energisa" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Data" htmlFor="data">
          <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </Field>
        <Field label="Forma">
          <Select value={forma} onValueChange={(v) => setForma(v as FormaPagamento)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FORMAS.map((f) => <SelectItem key={f} value={f}>{FORMA_LABEL[f]}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Fundo">
        <Select value={fundoId} onValueChange={setFundoId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {fundos.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Comprovante">
        <PhotoInput value={comprovanteUrl} onChange={setComprovanteUrl} />
      </Field>

      <Field label="Observação (opcional)" htmlFor="obs">
        <Textarea id="obs" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Anotação…" />
      </Field>
    </FormShell>
  )
}
