# Test API End-to-End against SQL Server
$ErrorActionPreference = 'Stop'

Write-Host ">>> 1. Probando Login contra saas.[User] en SQL Server..."
$loginPayload = @{
    email = "admin@condominio.com"
    password = "Password123!"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:5048/api/v1/auth/login" -Method Post -Body $loginPayload -ContentType "application/json"
Write-Host ">>> Login Exitoso!" -ForegroundColor Green
Write-Host "    UserId: $($loginRes.userId)"
Write-Host "    Role: $($loginRes.role)"
Write-Host "    TenantId: $($loginRes.tenantId)"
Write-Host "    Status: $($loginRes.tenantStatus)"

$headers = @{
    Authorization = "Bearer $($loginRes.token)"
}

Write-Host "`n>>> 2. Probando GET /api/v1/properties (app.Property)..."
$props = Invoke-RestMethod -Uri "http://localhost:5048/api/v1/properties" -Method Get -Headers $headers
Write-Host "    Propiedades encontradas: $($props.Count)" -ForegroundColor Green
foreach ($p in $props) {
    Write-Host "    - [$($p.id)] $($p.name) | $($p.address)"
}

$propId = $props[0].id

Write-Host "`n>>> 3. Probando GET /api/v1/persons (app.Person)..."
$persons = Invoke-RestMethod -Uri "http://localhost:5048/api/v1/persons" -Method Get -Headers $headers
Write-Host "    Personas registradas: $($persons.Count)" -ForegroundColor Green
foreach ($per in $persons) {
    Write-Host "    - $($per.firstName) $($per.lastName) | RNC/Cédula: $($per.taxId) | Email: $($per.email)"
}

Write-Host "`n>>> 4. Probando GET /api/v1/invoices/unpaid (app.Invoice)..."
$invoices = Invoke-RestMethod -Uri "http://localhost:5048/api/v1/invoices/unpaid" -Method Get -Headers $headers
Write-Host "    Facturas por cobrar encontradas: $($invoices.Count)" -ForegroundColor Green
foreach ($inv in $invoices) {
    Write-Host "    - NCF: $($inv.fiscalReceiptNumber) | Monto: RD$ $($inv.amount) | Balance: RD$ $($inv.balanceDue) | Estado: $($inv.status)"
}

Write-Host "`n>>> 5. Probando GET /api/v1/expenses/property/$propId (app.Expense)..."
$expenses = Invoke-RestMethod -Uri "http://localhost:5048/api/v1/expenses/property/$propId" -Method Get -Headers $headers
Write-Host "    Gastos encontrados: $($expenses.Count)" -ForegroundColor Green
foreach ($exp in $expenses) {
    Write-Host "    - NCF: $($exp.fiscalReceiptNumber) | Concepto: $($exp.concept) | Monto: RD$ $($exp.amount)"
}

Write-Host "`n>>> 6. Probando GET /api/v1/facilities/amenities/property/$propId (app.Amenity)..."
$amenities = Invoke-RestMethod -Uri "http://localhost:5048/api/v1/facilities/amenities/property/$propId" -Method Get -Headers $headers
Write-Host "    Amenidades encontradas: $($amenities.Count)" -ForegroundColor Green
foreach ($am in $amenities) {
    Write-Host "    - $($am.name) | Capacidad: $($am.capacity) personas | Tarifa/Hora: RD$ $($am.hourlyRate)"
}

Write-Host "`n>>> 7. Probando GET /api/v1/helpdesk/property/$propId (app.MaintenanceTicket)..."
$tickets = Invoke-RestMethod -Uri "http://localhost:5048/api/v1/helpdesk/property/$propId" -Method Get -Headers $headers
Write-Host "    Tickets de soporte encontrados: $($tickets.Count)" -ForegroundColor Green
foreach ($tk in $tickets) {
    Write-Host "    - [$($tk.priority)] $($tk.title) | Estado: $($tk.status)"
}

Write-Host "`n============================================================"
Write-Host ">>> TODAS LAS PRUEBAS CON DATOS REALES EN SQL SERVER PASARON!" -ForegroundColor Green
Write-Host "============================================================"
