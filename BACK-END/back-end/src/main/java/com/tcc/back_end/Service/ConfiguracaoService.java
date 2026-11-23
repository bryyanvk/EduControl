
package com.tcc.back_end.Service;

import com.tcc.back_end.DTO.RegrasEscolaRequestDTO;
import com.tcc.back_end.DTO.RegrasEscolaResponseDTO;
import com.tcc.back_end.DTO.ConfiguracaoGeralRequestDTO;
import com.tcc.back_end.DTO.ConfiguracaoGeralResponseDTO;
import com.tcc.back_end.DTO.ConfNotificacaoRequestDTO;
import com.tcc.back_end.DTO.ConfNotificacaoResponseDTO;
import com.tcc.back_end.DTO.ConfiguracaoRFIDRequestDTO;
import com.tcc.back_end.DTO.ConfiguracaoRFIDResponseDTO;
import com.tcc.back_end.Model.RegrasEscola;
import com.tcc.back_end.Model.ConfiguracaoGeral;
import com.tcc.back_end.Model.ConfNotificacao;
import com.tcc.back_end.Model.ConfiguracaoRFID;
import com.tcc.back_end.Repository.ConfiguracaoRepository;
import org.springframework.stereotype.Service;

@Service
public class ConfiguracaoService {

    private final ConfiguracaoRepository configuracaoRepository;

    public ConfiguracaoService(ConfiguracaoRepository configuracaoRepository) {
        this.configuracaoRepository = configuracaoRepository;
    }

    public RegrasEscolaResponseDTO buscarRegrasEscola() {
        RegrasEscola regras = configuracaoRepository.getRegrasEscola();

        if (regras == null) {
            return null;
        }

        RegrasEscolaResponseDTO dto = new RegrasEscolaResponseDTO();
        dto.setHorarioLimite(regras.getHorarioLimite());
        dto.setAnoLetivo(regras.getAnoLetivo());
        dto.setTurno(regras.getTurno());

        return dto;
    }

    public String salvarRegrasEscola(RegrasEscolaRequestDTO dto) {
        if (dto == null) {
            return "Configurações não informadas.";
        }

        if (dto.getHorarioLimite() == null) {
            return "O horário limite é obrigatório.";
        }

        if (dto.getAnoLetivo() == null || dto.getAnoLetivo() < 2000) {
            return "Ano letivo inválido.";
        }

        if (dto.getTurno() == null || dto.getTurno().isBlank()) {
            return "O turno é obrigatório.";
        }

        RegrasEscola regras = new RegrasEscola(
                dto.getHorarioLimite(),
                dto.getAnoLetivo(),
                dto.getTurno()
        );

        configuracaoRepository.salvarRegrasEscola(regras);

        return "Regras da escola atualizadas com sucesso.";
    }

    public ConfiguracaoGeralResponseDTO buscarConfiguracaoGeral() {
        ConfiguracaoGeral config = configuracaoRepository.getConfiguracaoGeral();

        if (config == null) {
            return null;
        }

        ConfiguracaoGeralResponseDTO dto = new ConfiguracaoGeralResponseDTO();
        dto.setAparencia(config.getAparencia());
        dto.setIdioma(config.getIdioma());

        return dto;
    }

    public String salvarConfiguracaoGeral(ConfiguracaoGeralRequestDTO dto) {
        if (dto == null) {
            return "Configuração não informada.";
        }

        if (dto.getAparencia() == null || dto.getAparencia().isBlank()) {
            return "A aparência é obrigatória.";
        }

        if (dto.getIdioma() == null || dto.getIdioma().isBlank()) {
            return "O idioma é obrigatório.";
        }

        ConfiguracaoGeral config = new ConfiguracaoGeral(
                dto.getAparencia(),
                dto.getIdioma()
        );

        configuracaoRepository.salvarConfiguracaoGeral(config);

        return "Configurações gerais atualizadas com sucesso.";
    }

    public ConfNotificacaoResponseDTO buscarNotificacoes() {
        ConfNotificacao notificacao = configuracaoRepository.getNotificacao();

        if (notificacao == null) {
            return null;
        }

        ConfNotificacaoResponseDTO dto = new ConfNotificacaoResponseDTO();
        dto.setNotificacoesSistema(notificacao.isNotificacoesSistema());
        dto.setFaltasAtrasos(notificacao.isFaltasAtrasos());
        dto.setAlunosEmRisco(notificacao.isAlunosEmRisco());
        dto.setNovosAlunos(notificacao.isNovosAlunos());
        dto.setProfessoresAusentes(notificacao.isProfessoresAusentes());
        dto.setRelatoriosEmail(notificacao.isRelatoriosEmail());

        return dto;
    }

    public String salvarNotificacoes(ConfNotificacaoRequestDTO dto) {
        if (dto == null) {
            return "Notificações não informadas.";
        }

        ConfNotificacao notificacao = new ConfNotificacao(
                dto.isNotificacoesSistema(),
                dto.isFaltasAtrasos(),
                dto.isAlunosEmRisco(),
                dto.isNovosAlunos(),
                dto.isProfessoresAusentes(),
                dto.isRelatoriosEmail()
        );

        configuracaoRepository.salvarNotificacao(notificacao);

        return "Notificações atualizadas com sucesso.";
    }

    public ConfiguracaoRFIDResponseDTO buscarConfiguracaoRFID() {
        ConfiguracaoRFID rfid = configuracaoRepository.getConfiguracaoRFID();

        if (rfid == null) {
            return null;
        }

        ConfiguracaoRFIDResponseDTO dto = new ConfiguracaoRFIDResponseDTO();
        dto.setLeitorAtivo(rfid.isLeitorAtivo());

        return dto;
    }

    public String salvarConfiguracaoRFID(ConfiguracaoRFIDRequestDTO dto) {
        if (dto == null) {
            return "Configuração RFID não informada.";
        }

        ConfiguracaoRFID rfid = new ConfiguracaoRFID(dto.isLeitorAtivo());

        configuracaoRepository.salvarConfiguracaoRFID(rfid);

        return "Configuração RFID atualizada com sucesso.";
    }
}
