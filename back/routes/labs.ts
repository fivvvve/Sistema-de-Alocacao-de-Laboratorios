import { Request, Response, Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router();
const prisma = new PrismaClient();

router.get("/lab", async (req: Request, res: Response) => {

    const { nome } = req.query;

    try {
        
        const lab = await prisma.laboratorio.findUniqueOrThrow({
            where: {
                nome: String(nome)
            },
            include: {
                responsavel: true
            }
        });

        const labRet = {
            nome: lab.nome,
            responsavel: lab.responsavel.nome,
            capacidade: lab.capacidade,
            projetores: lab.projetor? lab.projetor : 'Não possui',
            quadros: lab.quadro? lab.quadro : 'Não possui',
            televisoes: lab.televisao? lab.televisao : 'Não possui',
            ar_condicionados: lab.ar_contidionado? lab.ar_contidionado : 'Não possui',
            computadores: lab.computador? lab.computador : 'Não possui',
            outro: lab.outro? lab.outro : ''
        }

        res.status(200).send(labRet);
        return;

    } catch (error: any) {

        if(error.code === 'P2025') {
            res.status(404).send('Laboratorio inexistente');
            return;
        }

        res.status(400).send('database off');
        return;
    }

});

router.get('/lab/reservasdia', async (req: Request, res: Response) => {

    const { nome, dia } = req.query;
    let data = new Date(String(dia));
    let data1 = new Date(String(dia));
    data1.setUTCDate(data1.getUTCDate()+1)
    
    data.setUTCHours(0, 0, 0, 0);
    data1.setUTCHours(0, 0, 0, 0);

    try {
        
        const laboratorio = await prisma.laboratorio.findUniqueOrThrow({
            where: {
                nome: String(nome)
            },
            include: {
                reservas: {
                    where: {
                        data_inicio: {
                            lte: data
                        },
                        data_fim: {
                            gte: data
                        },
                    },
                    include: {
                        dias: {
                            where: {
                                data_inicio: {
                                    gte: data
                                },
                                data_fim: {
                                    lte: data1
                                },
                            }
                        }
                    },
                    orderBy: {
                        data_inicio: 'asc'
                    },
                }
            }
        });
        
        if(!laboratorio?.reservas) {
            res.status(404).send('Nao ha reservas no dia');
            return;
        }

        const reservasHoje = []
        for(const reservaInfo of laboratorio.reservas) {
            for(const reserva of reservaInfo.dias) {
                
                let string_hora = '';
                if(reserva.data_inicio.getUTCHours() < 10) string_hora = '0' + reserva.data_inicio.getUTCHours();
                else string_hora += reserva.data_inicio.getUTCHours();

                let string_min = '';
                if(reserva.data_inicio.getUTCMinutes() < 10) string_min = '0' + reserva.data_inicio.getUTCMinutes();
                else string_min += reserva.data_inicio.getUTCMinutes();

                reservasHoje.push({
                    hora_inicio: `${string_hora}:${string_min}`,
                    duracao: reserva.duracao
                });

            }
        }

        res.status(200).send(reservasHoje);
        return;

    } catch (error: any) {
        
        if(error.code === 'P2025') {
            res.status(404).send('Laboratorio inexistente');
            return;
        }

        res.status(400).send('database off');
        return;

    }

});


export default router;