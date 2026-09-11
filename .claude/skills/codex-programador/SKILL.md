---
name: codex-programador
description: Delegar la escritura de código al Codex CLI (Claude planifica y revisa, Codex programa) para ahorrar tokens de Claude. Usar en features o refactors de varios archivos con un spec claro, o para pedirle a Codex una segunda revisión de los cambios sin commitear. No usar para ediciones chicas ni con archivos que tengan credenciales.
---

# Codex programador

Claude es el jefe: entiende el pedido, escribe un spec acotado, delega, revisa el diff, verifica y commitea. Codex es el programador: edita el working tree y nada más. Codex usa la cuenta de OpenAI de Alex, así que **todo el código que lee sale hacia OpenAI**.

## Cuándo sí y cuándo no

- **Sí:** generación voluminosa con criterios claros (una pantalla nueva, un controlador con sus rutas, un módulo con sus pruebas).
- **No:** cambios de pocas líneas (escribir el spec y leer el diff cuesta más que hacerlo), decisiones de diseño abiertas (primero se deciden con Alex), archivos con secretos (`.env`, credenciales de Aiven o Brevo).

## 0. Comprobar que Codex está disponible

```bash
command -v codex >/dev/null && codex login status
```

Si no hay `codex` o no hay login (por ejemplo, en una sesión en la nube), **no delegar**: Claude hace la tarea directo y lo avisa en una línea. En PowerShell usar `codex.cmd`, porque la ExecutionPolicy bloquea `codex.ps1`.

## 1. Partir de un working tree limpio

`git status --porcelain` tiene que salir vacío, así el diff que se revisa es solo de Codex. Si hay cambios, preguntarle a Alex si se commitean antes.

## 2. Escribir el spec

Los archivos de trabajo van en `.git/codex/` (no se versiona y sobrevive entre llamadas de Bash): el spec en `.git/codex/tarea.md`. Una sola tarea por corrida.

```xml
<task>
Qué hay que hacer, en qué archivos, y qué no se toca.
</task>
<contexto>
Solo lo que Codex no puede deducir leyendo el repo: decisiones ya tomadas, contrato de la API, nombres a respetar.
</contexto>
<criterios_de_aceptacion>
- Lista verificable de lo que tiene que cumplirse.
</criterios_de_aceptacion>
<verificacion>
Comandos a correr antes de terminar, por ejemplo `npm run build` en FRONT/ o `php -l` sobre los PHP tocados.
</verificacion>
<action_safety>
No hacer commits ni push. No tocar archivos fuera del alcance. No refactorizar lo que no se pidió. No leer ni modificar .env.
</action_safety>
<structured_output_contract>
Respondé en español, en menos de 10 líneas: archivos tocados, verificación hecha y su resultado, dudas o riesgos.
</structured_output_contract>
```

## 3. Delegar

Desde la raíz del repo:

```bash
D="$(git rev-parse --absolute-git-dir)/codex"; mkdir -p "$D"
codex exec -s workspace-write -c 'windows.sandbox="unelevated"' --color never \
  -o "$D/resultado.md" - < "$D/tarea.md" > "$D/log.txt" 2>&1; echo "exit=$?"
grep -E "^(sandbox|session id):" "$D/log.txt"
```

- Si la tarea puede tardar más de un par de minutos, correrlo con `run_in_background`: avisa al terminar y no tiene el límite de 10 minutos.
- La línea `sandbox:` tiene que decir `workspace-write`. Sin `-c 'windows.sandbox="unelevated"'`, en Windows Codex arranca en `read-only`, no escribe nada y aun así sale con código 0.
- Leer **solo** `resultado.md`. El log se abre únicamente si el código de salida no es 0 (`tail -30`).

## 4. Revisar (siempre lo hace Claude)

1. `git status --porcelain` y `git diff --stat`: ¿tocó solo lo que tenía que tocar?
2. `git diff` completo de los archivos relevantes. No alcanza con el resumen de Codex.
3. Correr la verificación por cuenta propia (build, `php -l`, probar el endpoint).
4. Si el problema es chico, arreglarlo directo; si es grande, pedir la corrección (paso 5).

## 5. Pedir correcciones en la misma sesión

Con el id de la línea `session id:` del log, mandar solo lo que hay que cambiar:

```bash
codex exec resume <SESSION_ID> -c 'sandbox_mode="workspace-write"' -c 'windows.sandbox="unelevated"' \
  -o "$D/resultado.md" "Corregí: ..." > "$D/log.txt" 2>&1; echo "exit=$?"
```

`resume` no acepta `-s` ni `--color`: el sandbox se pasa con `-c sandbox_mode=...`. Se usa el id y no `--last`, porque `--last` toma la sesión más reciente aunque sea de otra tarea.

## 6. Segunda opinión (opcional)

Antes de commitear un cambio grande, pedirle a Codex que revise lo que está sin commitear:

```bash
codex exec review --uncommitted -c 'sandbox_mode="read-only"' -c 'windows.sandbox="unelevated"' \
  -o "$D/revision.md" > "$D/log-revision.txt" 2>&1; echo "exit=$?"
```

`--uncommitted` no acepta instrucciones propias, así que la revisión sale en inglés; Claude se la resume a Alex en español. Sus hallazgos son sugerencias: cada uno se verifica en el código antes de actuar.

## 7. Cerrar

- El commit lo hace Claude: chico y con mensaje en español. Codex nunca commitea ni pushea.
- Si Codex falla por límite de uso (el plan gratis de OpenAI tiene poca cuota) o no termina la tarea, Claude la sigue directo y lo avisa.
