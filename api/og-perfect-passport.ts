import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

const WIDTH = 1200;
const HEIGHT = 630;

function cleanParam(value: string | null, fallback: string, maxLength = 40): string {
  const clean = (value || fallback).replace(/[^\w\s+./-]/g, '').trim();
  return (clean || fallback).slice(0, maxLength);
}

function loadFont(name: string): Buffer {
  return readFileSync(join(process.cwd(), 'scripts', name));
}

type SatoriNode = Record<string, unknown>;

function buildOgMarkup({
  score,
  grade,
  title,
  best,
}: {
  score: string;
  grade: string;
  title: string;
  best: string;
}): SatoriNode {
  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        background: '#62b9e6',
        color: '#2D2D2D',
        fontFamily: 'Press Start 2P',
        position: 'relative',
        padding: '42px',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              padding: '34px 40px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '30px',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          background: '#1E8F48',
                          border: '5px solid #2D2D2D',
                          boxShadow: '6px 6px 0 #2D2D2D',
                          color: '#FFFFFF',
                          fontFamily: 'Press Start 2P',
                          fontSize: '24px',
                          padding: '16px 20px',
                        },
                        children: 'PERFECT PASSPORT',
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontFamily: 'Press Start 2P',
                          fontSize: '18px',
                          color: '#2762C8',
                        },
                        children: 'CAN YOU BEAT IT?',
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'stretch',
                    gap: '28px',
                    flex: 1,
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          flex: 1,
                        },
                        children: [
                          {
                            type: 'div',
                            props: {
                              style: {
                                fontFamily: 'Press Start 2P',
                                fontSize: '116px',
                                lineHeight: 1,
                                color: '#2D2D2D',
                                textShadow: '6px 6px 0 #D7CDAF',
                                marginBottom: '26px',
                              },
                              children: score,
                            },
                          },
                          {
                            type: 'div',
                            props: {
                              style: {
                                fontFamily: 'Press Start 2P',
                                fontSize: '30px',
                                color: '#9A7425',
                                marginBottom: '24px',
                              },
                              children: title,
                            },
                          },
                          {
                            type: 'div',
                            props: {
                              style: {
                                fontSize: '25px',
                                lineHeight: 1.25,
                              },
                              children: 'Draft 10 countries. Take on the world tour. Try to top this score.',
                            },
                          },
                        ],
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          width: '320px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '18px',
                          justifyContent: 'center',
                        },
                        children: [
                          statBox('GRADE', grade),
                          statBox('BEST PICKS', `${best}/10`),
                          statBox('POSSIBLE', '197'),
                        ],
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontFamily: 'Press Start 2P',
                    fontSize: '22px',
                    color: '#2762C8',
                    marginTop: '24px',
                  },
                  children: 'PLAY NOW AT FLAG ARCADE',
                },
              },
            ],
          },
        },
      ],
    },
  };
}

function statBox(label: string, value: string): SatoriNode {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
        border: '6px solid #2D2D2D',
        boxShadow: '7px 7px 0 #2D2D2D',
        padding: '22px',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              fontSize: '22px',
                              color: '#6B5F50',
              marginBottom: '10px',
            },
            children: label,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontFamily: 'Press Start 2P',
              fontSize: value.length > 5 ? '30px' : '42px',
              color: '#2D2D2D',
            },
            children: value,
          },
        },
      ],
    },
  };
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const score = cleanParam(url.searchParams.get('score'), '197/197', 12);
  const grade = cleanParam(url.searchParams.get('grade'), 'S+', 3);
  const title = cleanParam(url.searchParams.get('title'), 'Perfect Passport', 28).toUpperCase();
  const best = cleanParam(url.searchParams.get('best'), '10', 2);

  const svg = await satori(buildOgMarkup({ score, grade, title, best }) as never, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      {
        name: 'Press Start 2P',
        data: loadFont('PressStart2P-Regular.ttf'),
        weight: 400,
        style: 'normal',
      },
    ],
  });

  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
  }).render().asPng();

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, s-maxage=2592000',
    },
  });
}
