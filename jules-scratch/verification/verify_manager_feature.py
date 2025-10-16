from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:3000/")

    # Se connecter
    page.get_by_label("Email").fill("test-crud@example.com")
    page.get_by_label("Mot de passe").fill("testpass123")
    page.get_by_role("button", name="Se connecter").click()

    # Attendre la redirection vers le tableau de bord
    expect(page).to_have_url("http://localhost:3000/dashboard")

    # Naviguer vers la page de détail du projet
    page.goto("http://localhost:3000/projects/1")

    # Attendre que le titre de la page soit visible
    expect(page.get_by_role("heading", level=1)).to_be_visible()

    page.screenshot(path="jules-scratch/verification/verification.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)