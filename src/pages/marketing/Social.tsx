import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { TrendingUp, Users, Eye, Heart, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, subDays, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

// Types
type Platform = 'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'twitter'
type MetricType = 'followers' | 'views' | 'likes' | 'engagement_rate' | 'reach'

interface SocialMetric {
    id: string
    platform: Platform
    metric_type: MetricType
    metric_value: number
    recorded_date: string
    notes?: string
}

const PLATFORMS: { value: Platform; label: string; color: string }[] = [
    { value: 'tiktok', label: 'TikTok', color: '#000000' },
    { value: 'instagram', label: 'Instagram', color: '#E1306C' },
    { value: 'youtube', label: 'YouTube', color: '#FF0000' },
    { value: 'facebook', label: 'Facebook', color: '#1877F2' },
]

const METRIC_TYPES: { value: MetricType; label: string; icon: React.ElementType }[] = [
    { value: 'followers', label: 'Seguidores', icon: Users },
    { value: 'views', label: 'Vistas/Reproducciones', icon: Eye },
    { value: 'likes', label: 'Me Gusta/Likes', icon: Heart },
    { value: 'engagement_rate', label: 'Tasa de Interacción (%)', icon: Activity },
    { value: 'reach', label: 'Alcance', icon: TrendingUp },
]

export default function SocialDashboard() {
    const [metrics, setMetrics] = useState<SocialMetric[]>([])
    const [loading, setLoading] = useState(true)

    // Form state
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [adding, setAdding] = useState(false)
    const [formData, setFormData] = useState({
        platform: 'tiktok' as Platform,
        metric_type: 'followers' as MetricType,
        metric_value: '',
        recorded_date: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
    })

    const fetchMetrics = async () => {
        try {
            setLoading(true)
            const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')

            const { data, error } = await supabase
                .from('social_metrics')
                .select('*')
                .gte('recorded_date', thirtyDaysAgo)
                .order('recorded_date', { ascending: true })

            if (error) throw error
            setMetrics(data || [])
        } catch (error: any) {
            toast.error('Error al cargar métricas: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMetrics()
    }, [])

    const handleAddMetric = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.metric_value) return toast.error('Ingresa un valor válido.')

        setAdding(true)
        try {
            const { error } = await supabase
                .from('social_metrics')
                .upsert({
                    platform: formData.platform,
                    metric_type: formData.metric_type,
                    metric_value: parseFloat(formData.metric_value),
                    recorded_date: formData.recorded_date,
                    notes: formData.notes
                }, {
                    onConflict: 'platform,metric_type,recorded_date'
                })

            if (error) throw error

            toast.success('Métrica registrada exitosamente.')
            setIsAddOpen(false)
            setFormData(prev => ({ ...prev, metric_value: '', notes: '' })) // reset partial state
            fetchMetrics()
        } catch (error: any) {
            toast.error('Error al guardar: ' + error.message)
        } finally {
            setAdding(false)
        }
    }

    // Process data for charts
    // We want a chart that shows followers over time, comparing platforms.
    const processFollowersData = () => {
        const followersMetrics = metrics.filter(m => m.metric_type === 'followers')

        // Group by date
        const groupedByDate: Record<string, any> = {}

        followersMetrics.forEach(m => {
            if (!groupedByDate[m.recorded_date]) {
                groupedByDate[m.recorded_date] = {
                    date: format(parseISO(m.recorded_date), 'dd MMM', { locale: es }),
                    rawDate: m.recorded_date
                }
            }
            groupedByDate[m.recorded_date][m.platform] = m.metric_value
        })

        // Sort by date to be safe
        return Object.values(groupedByDate).sort((a, b) => a.rawDate.localeCompare(b.rawDate))
    }

    const chartData = processFollowersData()

    // Get latest metrics for summaries
    const getLatestMetric = (platform: Platform, type: MetricType) => {
        const filtered = metrics.filter(m => m.platform === platform && m.metric_type === type)
        if (filtered.length === 0) return 0
        return filtered[filtered.length - 1].metric_value
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Marketing Analytics</h2>
                    <p className="text-muted-foreground">Monitorea el impacto de tus campañas sociales.</p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary text-primary-foreground">
                            <Activity className="w-4 h-4 mr-2" />
                            Registrar Métrica Manual
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Registrar Métrica Social</DialogTitle>
                            <DialogDescription>
                                Agrega manualmente los seguidores, reproducciones o alcance del día.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleAddMetric} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Plataforma</Label>
                                    <Select
                                        value={formData.platform}
                                        onValueChange={(val: Platform) => setFormData({ ...formData, platform: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PLATFORMS.map(p => (
                                                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Fecha</Label>
                                    <Input
                                        type="date"
                                        required
                                        value={formData.recorded_date}
                                        onChange={e => setFormData({ ...formData, recorded_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Tipo de Métrica</Label>
                                <Select
                                    value={formData.metric_type}
                                    onValueChange={(val: MetricType) => setFormData({ ...formData, metric_type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {METRIC_TYPES.map(m => (
                                            <SelectItem key={m.value} value={m.value}>
                                                <div className="flex items-center gap-2">
                                                    <m.icon className="w-4 h-4 text-muted-foreground" />
                                                    {m.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Valor (Cantidad)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    required
                                    placeholder="Ej. 15000"
                                    value={formData.metric_value}
                                    onChange={e => setFormData({ ...formData, metric_value: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Notas (Opcional)</Label>
                                <Input
                                    placeholder="Ej. Video viral Charizard"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={adding}>
                                    {adding ? 'Guardando...' : 'Guardar Métrica'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summaries */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            TikTok Seguidores
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {getLatestMetric('tiktok', 'followers').toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Último registro cargado</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Instagram Seguidores
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {getLatestMetric('instagram', 'followers').toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Último registro cargado</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            TikTok Vistas (Recientes)
                        </CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {getLatestMetric('tiktok', 'views').toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Último registro cargado</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Instagram Vistas (Recientes)
                        </CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {getLatestMetric('instagram', 'views').toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Último registro cargado</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Crecimiento de Seguidores (Últimos 30 días)</CardTitle>
                    <CardDescription>
                        Visualiza la tendencia histórica de tu audiencia consolidada por plataforma.
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <p className="text-muted-foreground">Cargando gráfica...</p>
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center border-2 border-dashed rounded-lg bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                            <div className="text-center space-y-2">
                                <TrendingUp className="w-8 h-8 mx-auto text-neutral-400" />
                                <p className="text-sm text-muted-foreground font-medium">No hay datos históricos registrados aún.</p>
                                <p className="text-xs text-muted-foreground">Registra métricas usando el botón superior para ver el crecimiento.</p>
                            </div>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" opacity={0.2} />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    padding={{ left: 10, right: 10 }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                {PLATFORMS.map(platform => (
                                    <Line
                                        key={platform.value}
                                        type="monotone"
                                        dataKey={platform.value}
                                        name={platform.label}
                                        stroke={platform.color}
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2 }}
                                        activeDot={{ r: 6 }}
                                        connectNulls
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
