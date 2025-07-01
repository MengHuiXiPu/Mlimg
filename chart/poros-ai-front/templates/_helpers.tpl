{{- define "service.labels.standard" -}}
app.tcl-vue-cli.io/release: {{ .Release.Name | quote }}
{{- end -}}

{{- define "service.logging.deployment.label" -}}
app.tcl-vue-cli.io/logs-parser: {{ .Values.logs.parser | quote }}
{{- end -}}