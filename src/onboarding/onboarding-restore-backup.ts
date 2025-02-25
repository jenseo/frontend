import "@material/mwc-button/mwc-button";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import "../../hassio/src/components/hassio-ansi-to-html";
import { showHassioBackupDialog } from "../../hassio/src/dialogs/backup/show-dialog-hassio-backup";
import { showBackupUploadDialog } from "../../hassio/src/dialogs/backup/show-dialog-backup-upload";
import type { LocalizeFunc } from "../common/translations/localize";
import "../components/ha-card";
import {
  DiscoveryInformation,
  fetchDiscoveryInformation,
} from "../data/discovery";
import { makeDialogManager } from "../dialogs/make-dialog-manager";
import { ProvideHassLitMixin } from "../mixins/provide-hass-lit-mixin";
import { haStyle } from "../resources/styles";
import "./onboarding-loading";

declare global {
  interface HASSDomEvents {
    restoring: undefined;
  }
}

@customElement("onboarding-restore-backup")
class OnboardingRestoreBackup extends ProvideHassLitMixin(LitElement) {
  @property() public localize!: LocalizeFunc;

  @property() public language!: string;

  @property({ type: Boolean }) public restoring = false;

  @property({ attribute: false })
  public discoveryInformation?: DiscoveryInformation;

  protected render(): TemplateResult {
    return this.restoring
      ? html`<ha-card
          .header=${this.localize(
            "ui.panel.page-onboarding.restore.in_progress"
          )}
        >
          <onboarding-loading></onboarding-loading>
        </ha-card>`
      : html`
          <button class="link" @click=${this._uploadBackup}>
            ${this.localize("ui.panel.page-onboarding.restore.description")}
          </button>
        `;
  }

  private _uploadBackup(): void {
    showBackupUploadDialog(this, {
      showBackup: (slug: string) => this._showBackupDialog(slug),
      onboarding: true,
    });
  }

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);
    makeDialogManager(this, this.shadowRoot!);
    setInterval(() => this._checkRestoreStatus(), 1000);
  }

  private async _checkRestoreStatus(): Promise<void> {
    if (this.restoring) {
      try {
        const response = await fetchDiscoveryInformation();

        if (
          !this.discoveryInformation ||
          this.discoveryInformation.uuid !== response.uuid
        ) {
          // When the UUID changes, the restore is complete
          window.location.replace("/");
        }
      } catch (err) {
        // We fully expected issues with fetching info untill restore is complete.
      }
    }
  }

  private _showBackupDialog(slug: string): void {
    showHassioBackupDialog(this, {
      slug,
      onboarding: true,
      localize: this.localize,
    });
  }

  static get styles(): CSSResultGroup {
    return [
      haStyle,
      css`
        .logentry {
          text-align: center;
        }
        ha-card {
          padding: 4px;
          margin-top: 8px;
        }
        hassio-ansi-to-html {
          display: block;
          line-height: 22px;
          padding: 0 8px;
          white-space: pre-wrap;
        }

        @media all and (min-width: 600px) {
          ha-card {
            width: 600px;
            margin-left: -100px;
          }
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "onboarding-restore-backup": OnboardingRestoreBackup;
  }
}
