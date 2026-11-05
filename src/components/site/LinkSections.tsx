import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { SectionHeading } from '../ui/SectionHeading'
import { SITE_PLATFORMS, type SiteData, type SitePlatform } from '../../types/site'
import { Field, RemoveButton, inputClass, type ChangeSite } from './fields'

const PLATFORM_KEYS = Object.keys(SITE_PLATFORMS) as SitePlatform[]

export function LinksSection({ data, change }: { data: SiteData; change: ChangeSite }) {
  return (
        <div>
          <SectionHeading className="mb-2">Pages de l’artiste</SectionHeading>
          <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">Laisse un champ vide pour retirer la plateforme du site.</p>
          <Card className="grid gap-3 p-4 sm:grid-cols-2">
            {PLATFORM_KEYS.map((key) => (
              <Field key={key} label={SITE_PLATFORMS[key]}>
                <input
                  className={inputClass}
                  type="url"
                  value={data.platforms[key] ?? ''}
                  onChange={(event) =>
                    change((current) => {
                      const platforms = { ...current.platforms }
                      if (event.target.value) platforms[key] = event.target.value
                      else delete platforms[key]
                      return { ...current, platforms }
                    })
                  }
                />
              </Field>
            ))}
          </Card>
          <div className="mb-2 mt-6 flex items-center justify-between">
            <SectionHeading className="">Réseaux et autres liens</SectionHeading>
            <Button onClick={() => change((current) => ({ ...current, socials: [...current.socials, { label: '', handle: '', url: '' }] }))}>+ Ajouter un lien</Button>
          </div>
          <div className="space-y-2">
            {data.socials.map((social, index) => {
              const update = (fields: Partial<typeof social>) =>
                change((current) => ({ ...current, socials: current.socials.map((other, i) => (i === index ? { ...other, ...fields } : other)) }))
              return (
                <Card key={index} className="grid gap-3 p-4 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
                  <Field label="Nom">
                    <input className={inputClass} placeholder="Instagram" value={social.label} onChange={(event) => update({ label: event.target.value })} />
                  </Field>
                  <Field label="Détail">
                    <input className={inputClass} placeholder="@hsmusique" value={social.handle} onChange={(event) => update({ handle: event.target.value })} />
                  </Field>
                  <Field label="Adresse">
                    <input className={inputClass} type="url" placeholder="https://…" value={social.url} onChange={(event) => update({ url: event.target.value })} />
                  </Field>
                  <RemoveButton onClick={() => change((current) => ({ ...current, socials: current.socials.filter((_, i) => i !== index) }))} />
                </Card>
              )
            })}
          </div>
        </div>
  )
}

export function ShowsSection({ data, change }: { data: SiteData; change: ChangeSite }) {
  return (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Les concerts passés disparaissent seuls du téléphone.</p>
            <Button variant="primary" onClick={() => change((current) => ({ ...current, shows: [...current.shows, { date: '', city: '', venue: '', url: '' }] }))}>
              + Nouveau concert
            </Button>
          </div>
          {data.shows.length === 0 && <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">Aucun concert. La tuile Agenda reste cachée.</p>}
          {data.shows.map((show, index) => {
            const update = (fields: Partial<typeof show>) =>
              change((current) => ({ ...current, shows: current.shows.map((other, i) => (i === index ? { ...other, ...fields } : other)) }))
            return (
              <Card key={index} className="grid gap-3 p-4 sm:grid-cols-[auto_1fr_1fr_2fr_auto] sm:items-end">
                <Field label="Date">
                  <input className={inputClass} type="date" value={show.date} onChange={(event) => update({ date: event.target.value })} />
                </Field>
                <Field label="Ville">
                  <input className={inputClass} value={show.city} onChange={(event) => update({ city: event.target.value })} />
                </Field>
                <Field label="Salle">
                  <input className={inputClass} value={show.venue ?? ''} onChange={(event) => update({ venue: event.target.value })} />
                </Field>
                <Field label="Billetterie">
                  <input className={inputClass} type="url" placeholder="https://…" value={show.url ?? ''} onChange={(event) => update({ url: event.target.value })} />
                </Field>
                <RemoveButton onClick={() => change((current) => ({ ...current, shows: current.shows.filter((_, i) => i !== index) }))} />
              </Card>
            )
          })}
        </div>
  )
}
