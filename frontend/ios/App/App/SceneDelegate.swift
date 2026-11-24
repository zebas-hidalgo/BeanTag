import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = CAPBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)

        if let incomingURL = connectionOptions.urlContexts.first?.url {
            openDeepLink(incomingURL)
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)

        if let incomingURL = URLContexts.first?.url {
            openDeepLink(incomingURL)
        }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }

    private func resolveWebURL(from incomingURL: URL) -> URL? {
        guard incomingURL.scheme?.lowercased() == "beantag" else { return nil }
        let baseURL = "https://5.189.152.68.nip.io/beantag"
        let host = incomingURL.host ?? ""
        let path = incomingURL.path
        let query = incomingURL.query.map { "?\($0)" } ?? ""

        if host == "batch" {
            let cleanPath = path.hasPrefix("/") ? path : "/\(path)"
            return URL(string: "\(baseURL)/batch\(cleanPath)\(query)")
        }
        if path.contains("/batch/") {
            let cleanPath = path.hasPrefix("/") ? path : "/\(path)"
            return URL(string: "\(baseURL)\(cleanPath)\(query)")
        }
        return URL(string: "\(baseURL)/\(query)")
    }

    private func openDeepLink(_ incomingURL: URL, attempt: Int = 0) {
        guard let targetURL = resolveWebURL(from: incomingURL) else { return }
        if let bridgeVC = window?.rootViewController as? CAPBridgeViewController,
           let webView = bridgeVC.webView {
            if webView.url == nil && attempt < 15 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { [weak self] in
                    self?.openDeepLink(incomingURL, attempt: attempt + 1)
                }
                return
            }
            webView.load(URLRequest(url: targetURL))
        } else if attempt < 20 {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { [weak self] in
                self?.openDeepLink(incomingURL, attempt: attempt + 1)
            }
        }
    }
}
