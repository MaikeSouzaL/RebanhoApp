import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { toast } from 'sonner'
import { useData } from '@/store/data'
import { isoDayOf } from '@/lib/report'
import { FORMA_LABEL } from '@/data/categorias'
import type { FormaPagamento, TipoEntrada } from '@/data/types'
import { CurrencyInput } from '@/components/shared/currency-input'
import { MemberPicker } from '@/components/shared/member-picker'
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

const SUBTIPOS_OFERTA = ['Culto', 'Missões', 'Construção', 'Gratidão', 'Primícias', 'Ação de graças']
const FORMAS: FormaPagamento[] = ['pix', 'dinheiro', 'cartao', 'transferencia']

const schema = z.object({ valor: z.number().positive('Informe um valor maior que zero.') })

export function EntradaFormPage({ tipo }: { tipo: TipoEntrada }) {
  const { fundos, addEntrada } = useData()
  const navigate = useNavigate()
  const isDizimo = tipo === 'dizimo'

  const [valor, setValor] = useState(0)
  const [membroId, setMembroId] = useState<string | null>(isDizimo ? null : null)
  const [subtipo, setSubtipo] = useState(SUBTIPOS_OFERTA[0]!)
  const [fundoId, setFundoId] = useState('f-geral')
  const [data, setData] = useState(isoDayOf(new Date()))
  const [forma, setForma] = useState<FormaPagamento>('pix')
  const [obs, setObs] = useState('')
  const [erro, setErro] = useState<string>()

  function onSubtipoChange(v: string) {
    setSubtipo(v)
    if (v === 'Missões') setFundoId('f-missoes')
    else if (v === 'Construção') setFundoId('f-construcao')
    else setFundoId('f-geral')
  }

  function salvar() {
    const res = schema.safeParse({ valor })
    if (!res.success) {
      setErro(res.error.issues[0]?.message)
      return
    }
    addEntrada({
      tipo,
      subtipo: isDizimo ? undefined : subtipo,
      valor,
      data,
      forma,
      fundoId,
      membroId: membroId,
      obs: obs.trim() || undefined,
    })
    toast.success(isDizimo ? 'Dízimo registrado!' : 'Oferta registrada!')
    navigate('/lancamentos')
  }

  return (
    <FormShell
      title={isDizimo ? 'Registrar dízimo' : 'Registrar oferta'}
      subtitle={isDizimo ? 'Contribuição de um membro' : 'Culto, missões, gratidão…'}
      onSubmit={salvar}
      submitLabel={isDizimo ? 'Salvar dízimo' : 'Salvar oferta'}
    >
      <Field label="Valor" error={erro} htmlFor="valor">
        <CurrencyInput id="valor" value={valor} onChange={(v) => { setValor(v); setErro(undefined) }} autoFocus />
      </Field>

      {!isDizimo && (
        <Field label="Tipo de oferta">
          <Select value={subtipo} onValueChange={onSubtipoChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUBTIPOS_OFERTA.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      <Field label={isDizimo ? 'Membro' : 'Membro (opcional)'} hint={isDizimo ? undefined : 'Deixe como anônimo se não identificado.'}>
        <MemberPicker value={membroId} onChange={setMembroId} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Data" htmlFor="data">
          <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </Field>
        <Field label="Forma">
          <Select value={forma} onValueChange={(v) => setForma(v as FormaPagamento)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORMAS.map((f) => (
                <SelectItem key={f} value={f}>
                  {FORMA_LABEL[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

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

      <Field label="Observação (opcional)" htmlFor="obs">
        <Textarea id="obs" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Anotação…" />
      </Field>
    </FormShell>
  )
}
